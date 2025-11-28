pipeline {
    agent any

    environment {
        GIT_REPO = 'https://github.com/JeevanKumar100/Food-Delivery-forking.git'

        FRONTEND_DIR = 'frontend'
        BACKEND_DIR = 'backend'

        AWS_ACCOUNT_ID = '803133979340'     // <<< REPLACE WITH YOUR ACCOUNT
        AWS_REGION = 'ap-south-1'

        FRONTEND_REPO = 'food-delivery-frontend'
        BACKEND_REPO = 'food-delivery-backend'

        AWS_CREDS = 'AWS-Credentials'         // Jenkins AWS Credentials ID
        KUBECONFIG_CRED = 'kubeconfig-aws'    // Jenkins kubeconfig secret file
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "📥 Checking out repository..."
                git branch: 'main', url: "${GIT_REPO}"
            }
        }

        stage('Create ECR Repositories If Not Exists') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDS}"]
                ]) {
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
                    echo "🛠️ Building Frontend Image..."
                    FRONTEND_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}:${BUILD_NUMBER}"

                    sh "docker build -t ${FRONTEND_ECR} ${FRONTEND_DIR}"
                    dockerImageFrontend = FRONTEND_ECR
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    echo "🛠️ Building Backend Image..."
                    BACKEND_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}:${BUILD_NUMBER}"

                    sh "docker build -t ${BACKEND_ECR} ${BACKEND_DIR}"
                    dockerImageBackend = BACKEND_ECR
                }
            }
        }

        stage('Push Images to ECR') {
            steps {
                script {
                    echo "📦 Pushing images to AWS ECR..."

                    withCredentials([
                        [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDS}"]
                    ]) {
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

                        # Update Frontend deployment
                        kubectl set image deployment/frontend-deployment \
                           frontend=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}:${BUILD_NUMBER} --record

                        # Update Backend deployment
                        kubectl set image deployment/backend-deployment \
                           backend=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}:${BUILD_NUMBER} --record

                        # Apply services (LoadBalancer)
                        kubectl apply -f frontend/service.yaml
                        kubectl apply -f backend/service.yaml

                        echo "⏳ Waiting for rollout..."
                        kubectl rollout status deployment/frontend-deployment
                        kubectl rollout status deployment/backend-deployment

                        kubectl get svc -o wide
                    """
                }
            }
        }
    }

    post {
        success { echo "✅ Deployment completed successfully!" }
        failure { echo "❌ Deployment failed. Check Jenkins logs for details." }
    }
}
