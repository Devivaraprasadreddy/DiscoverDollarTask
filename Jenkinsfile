pipeline {
  agent any

  environment {
    VM_HOST = '3.235.190.236'
    VM_USERNAME = "root"
    DOCKERHUB_USERNAME = 'dsp9391'
  }

  stages {

    stage('Clone Repository') {
      steps {
        git branch: 'main', url: 'https://github.com/Devivaraprasadreddy/DiscoverDollarTask.git'
      }
    }

    stage('Login to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                                         usernameVariable: 'DOCKER_USER',
                                         passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
          '''
        }
      }
    }

    stage('Build Backend Image') {
      steps {
        sh '''
          docker build -t ${DOCKERHUB_USERNAME}/discoverdollar-backend:latest ./backend
          docker push ${DOCKERHUB_USERNAME}/discoverdollar-backend:latest
        '''
      }
    }

    stage('Build Frontend Image') {
      steps {
        sh '''
          docker build -t ${DOCKERHUB_USERNAME}/discoverdollar-frontend:latest ./frontend
          docker push ${DOCKERHUB_USERNAME}/discoverdollar-frontend:latest
        '''
      }
    }

    stage('Deploy to VM') {
      steps {
        withCredentials([sshUserPrivateKey(credentialsId: 'vmsshkey',
                                           keyFileVariable: 'SSH_KEY')]) {
          sh '''
            ssh -o StrictHostKeyChecking=no -i $SSH_KEY $VM_USERNAME@$VM_HOST "
              cd ~/DiscoverDollarTask
              docker compose pull
              docker compose up -d
            "
          '''
        }
      }
    }
  }
}
