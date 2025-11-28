pipeline {
    agent any

    environment {
        GIT_REPO       = 'https://github.com/JeevanKumar100/Food-Delivery-forking.git'

        FRONTEND_DIR   = 'frontend'
        BACKEND_DIR    = 'backend'

        AWS_ACCOUNT_ID = '803133979340'
        AWS_REGION     = 'ap-south-1'

        FRONTEND_REPO  = 'food-delivery-frontend'
        BACKEND_REPO   = 'food-delivery-backend'

        AWS_CREDS      = 'AWS-Credentials'
        KUBECONFIG_CRED = 'kubeconfig-aws'
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "📥 Checking out repository..."
                git branch: 'main', url: "${GIT_REPO}"
            }
        }

        stage('Create ECR Repos if Not Exists') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDS}"]]) {
                    sh """
                        aws ecr describe-repositories --repository-names ${FRONTEND_REPO} --region ${AWS_REGION} || \
                        aws ecr create-repository --repository-name ${FRONTEND_REPO} --region ${AWS_REGION}

                        aws ecr describe-repositories --repository-names ${BACKEND_REPO} --region ${AWS_REGION} || \
                        aws ecr create-repository --repository-name ${BACKEND_REPO} --region ${AWS_REGION}
                    """
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    echo "🛠 Building Frontend Image..."
                    FRONTEND_ECR = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}:${BUILD_NUMBER}"
                    sh "docker build -t ${FRONTEND_ECR} ${FRONTEND_DIR}"
                    dockerImageFrontend = FRONTEND_ECR
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    echo "🛠 Building Backend Image..."
                    BACKEND_ECR = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}:${BUILD_NUMBER}"
                    sh "docker build -t ${BACKEND_ECR} ${BACKEND_DIR}"
                    dockerImageBackend = BACKEND_ECR
                }
            }
        }

        stage('Push Images to ECR') {
            steps {
                script {
                    echo "📦 Pushing Docker images to ECR..."
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDS}"]]) {
                        sh """
                            aws ecr get-login-password --region ${AWS_REGION} | \
                            docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                            docker push ${dockerImageFrontend}
                            docker tag ${dockerImageFrontend} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}:latest
                            docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}:latest

                            docker push ${dockerImageBackend}
                            docker tag ${dockerImageBackend} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}:latest
                            docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([
                    file(credentialsId: "${KUBECONFIG_CRED}", variable: 'KUBECONFIG'),
                    [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDS}"]
                ]) {
                    sh """
                        export KUBECONFIG=${KUBECONFIG}
                        export AWS_REGION=${AWS_REGION}

                        echo "📦 Deploying MongoDB..."
                        kubectl apply -f 'MongoDB Deployment.yml'
                        kubectl apply -f 'MongoDB Service.yml'

                        echo "⏳ Waiting for MongoDB to become ready..."
                        kubectl rollout status deployment/mongo --timeout=120s

                        echo "🚀 Deploying Backend..."
                        kubectl apply -f backend/deployment.yaml
                        kubectl apply -f backend/service.yaml

                        echo "🔄 Updating Backend Image..."
                        kubectl set image deployment/food-delivery-backend \
                          food-delivery-backend=${dockerImageBackend}

                        kubectl rollout status deployment/food-delivery-backend --timeout=120s

                        echo "🚀 Deploying Frontend..."
                        kubectl apply -f frontend/deployment.yaml
                        kubectl apply -f frontend/service.yaml

                        echo "🔄 Updating Frontend Image..."
                        kubectl set image deployment/food-delivery-frontend \
                          food-delivery-frontend=${dockerImageFrontend}

                        kubectl rollout status deployment/food-delivery-frontend --timeout=120s

                        echo "🌐 Services:"
                        kubectl get svc -o wide
                    """
                }
            }
        }
    }

    post {
        success { echo "✅ Deployment completed successfully!" }
        failure { echo "❌ Deployment failed. Check Jenkins logs." }
    }
}
