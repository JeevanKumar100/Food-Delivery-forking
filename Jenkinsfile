pipeline {
    agent any

    environment {
        GIT_REPO = 'https://github.com/JeevanKumar100/Food-Delivery-forking.git'
        FRONTEND_DIR = 'frontend'
        BACKEND_DIR = 'backend'
        FRONTEND_IMAGE = 'jeevankumar01/food-delivery-frontend'
        BACKEND_IMAGE = 'jeevankumar01/food-delivery-backend'
        DOCKER_CREDS = '0ce9ce48-f95e-4b32-abcc-bd50695d96a1'       // DockerHub credentials ID
        KUBECONFIG_CRED = 'k8s-aws-v1.aHR0cHM6Ly9zdHMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tLz9BY3Rpb249R2V0Q2FsbGVySWRlbnRpdHkmVmVyc2lvbj0yMDExLTA2LTE1JlgtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQTNWN1VEN0xHUFdUWkFVV1IlMkYyMDI1MTAyMiUyRmFwLXNvdXRoLTElMkZzdHMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTAyMlQxMDQ2MTFaJlgtQW16LUV4cGlyZXM9NjAmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JTNCeC1rOHMtYXdzLWlkJlgtQW16LVNpZ25hdHVyZT1mYzgwNjNmYmYzYzcxZjM2ODIyNGMwZDFjZjBmN2NjNDBkNjk0MzUyODA0YjMzZjdhMTdjMzBiYjI2NzUzOTI5' // Jenkins kubeconfig credentials ID
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "📥 Checking out repository..."
                git branch: 'main', url: "${GIT_REPO}"
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    echo "🔧 Checking if Frontend image exists on DockerHub..."
                    def frontendExists = sh(
                        script: "docker pull ${FRONTEND_IMAGE}:latest || echo 'not found'",
                        returnStatus: true
                    )

                    if (frontendExists != 0) {
                        echo "🛠️ Building new Frontend Docker image..."
                        dockerImageFrontend = docker.build("${FRONTEND_IMAGE}:${BUILD_NUMBER}", "./${FRONTEND_DIR}")
                    } else {
                        echo "✅ Frontend image already exists. Skipping build."
                        dockerImageFrontend = docker.image("${FRONTEND_IMAGE}:latest")
                    }
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    echo "🔧 Checking if Backend image exists on DockerHub..."
                    def backendExists = sh(
                        script: "docker pull ${BACKEND_IMAGE}:latest || echo 'not found'",
                        returnStatus: true
                    )

                    if (backendExists != 0) {
                        echo "🛠️ Building new Backend Docker image..."
                        dockerImageBackend = docker.build("${BACKEND_IMAGE}:${BUILD_NUMBER}", "./${BACKEND_DIR}")
                    } else {
                        echo "✅ Backend image already exists. Skipping build."
                        dockerImageBackend = docker.image("${BACKEND_IMAGE}:latest")
                    }
                }
            }
        }

        stage('Push Images to DockerHub') {
            steps {
                script {
                    echo "📦 Pushing Docker images to DockerHub..."
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDS}") {
                        if (dockerImageFrontend) {
                            dockerImageFrontend.push()
                            dockerImageFrontend.push('latest')
                        }
                        if (dockerImageBackend) {
                            dockerImageBackend.push()
                            dockerImageBackend.push('latest')
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying application to Kubernetes..."
                    withCredentials([file(credentialsId: "${KUBECONFIG_CRED}", variable: 'KUBECONFIG')]) {
                        sh 'kubectl apply -f frontend/deployment.yaml'
                        sh 'kubectl apply -f frontend/service.yaml'
                        sh 'kubectl apply -f backend/deployment.yaml'
                        sh 'kubectl apply -f backend/service.yaml'
                        sh 'kubectl get pods -o wide'
                    }
                }
            }
        }

    }

    post {
        success {
            echo "✅ Deployment completed successfully!"
        }
        failure {
            echo "❌ Deployment failed. Check Jenkins logs for details."
        }
    }
}
