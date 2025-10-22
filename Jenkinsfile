pipeline {
    agent any

    environment {
        GIT_REPO = 'https://github.com/JeevanKumar100/Food-Delivery-forking.git'
        FRONTEND_DIR = 'frontend'
        BACKEND_DIR = 'backend'
        FRONTEND_IMAGE = 'jeevankumar01/food-delivery-frontend'
        BACKEND_IMAGE = 'jeevankumar01/food-delivery-backend'
        DOCKER_CREDS = '0ce9ce48-f95e-4b32-abcc-bd50695d96a1'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: "https://github.com/JeevanKumar100/Food-Delivery-forking.git"
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    echo "🔧 Building Frontend Docker Image..."
                    dockerImageFrontend = docker.build("${FRONTEND_IMAGE}:${BUILD_NUMBER}", "./${FRONTEND_DIR}")
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    echo "🔧 Building Backend Docker Image..."
                    dockerImageBackend = docker.build("${BACKEND_IMAGE}:${BUILD_NUMBER}", "./${BACKEND_DIR}")
                }
            }
        }

        stage('Push Images to DockerHub') {
            steps {
                script {
                    echo "📦 Pushing Images to DockerHub..."
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDS}") {
                        dockerImageFrontend.push()
                        dockerImageFrontend.push('latest')
                        dockerImageBackend.push()
                        dockerImageBackend.push('latest')
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    sh 'kubectl apply -f k8s/frontend-deployment.yaml'
                    sh 'kubectl apply -f k8s/frontend-service.yaml'
                    sh 'kubectl apply -f k8s/backend-deployment.yaml'
                    sh 'kubectl apply -f k8s/backend-service.yaml'
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
