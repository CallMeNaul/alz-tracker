pipeline {
    agent any
    
    environment {
        BUILD_SCM = 'https://github.com/CallMeNaul/alzheimers-data-hub.git'
        DEPLOY_SCM = 'https://github.com/CallMeNaul/alztrack-deployment.git'
        DOCKER_USER = 'callmenaul'
        DOCKER_IMAGE = 'alzheimer-app'
        DOCKER_IMAGE_BACKEND = 'alzheimer-backend'
        DOCKER_TAG = "v${BUILD_NUMBER}.0"
        APP_TAG = "${DOCKER_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}"
        SCANNER_HOME = "/var/jenkins/tools/hudson.plugins.sonar.SonarRunnerInstallation/SonarScanner"
        SONAR_PROJECT_KEY = "alztracker"
        SONARQUBE_URL = "http://10.0.2.4:9000"
        SONAR_QUBE_TOKEN = credentials('sonarqube-token')
        SCAN_OUTPUT = "vulnerabilities.txt"
        DEPLOYMENT_FILE = 'docker-compose.yml'
        DEPLOY_BRANCH = 'main'
    }

    stages {
        stage('Info') {
            steps {
                sh(label: "ℹ️ Showing system info", script: """
                    whoami
                    pwd
                    ls
                """)
            }
        }
        
        stage('Checkout') {
            steps {
                cleanWs()
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: 'main']],
                    userRemoteConfigs: [[
                        url: env.BUILD_SCM,
                        credentialsId: 'login-github'
                    ]]
                ])
            }
        }

        stage('Check Changes') {
            steps {
                script {
                    def changedFiles = sh(label: "🔍 Checking file changes", script: "git diff --name-only HEAD~1 HEAD", returnStdout: true).trim().split("\n")
                    if (changedFiles.length == 1 && changedFiles.contains("Jenkinsfile")) {
                        echo "✨ Only Jenkinsfile was changed - Pipeline will complete successfully"
                        currentBuild.result = 'SUCCESS'
                        env.ONLY_JENKINSFILE_CHANGED = 'true'
                        return
                    }

                    // Kiểm tra và lưu kết quả vào biến môi trường
                    env.BACKEND_CHANGES = sh(label: "🔍 Checking backend changes", 
                        script: "git diff --name-only HEAD~1 HEAD | grep '^backend/' || true", 
                        returnStdout: true).trim()
                    env.APP_CHANGES = sh(label: "🔍 Checking frontend/app changes", 
                        script: "git diff --name-only HEAD~1 HEAD | grep -v '^backend/' | grep -v '^Jenkinsfile\$' || true", 
                        returnStdout: true).trim()
                    
                    sh(label: "🔄 Change Detection Summary", script: """echo \"
Change Detection Results:
   Backend changes: ${env.BACKEND_CHANGES ? '✅ Yes' : '❌ No'}
   Frontend/App changes: ${env.APP_CHANGES ? '✅ Yes' : '❌ No'}
\"
                    """)
                }
            }
        }
        
        stage('SonarQube Analysis') {
            when {
                expression { return env.ONLY_JENKINSFILE_CHANGED != 'true' }
            }
            steps {
                script {
                    withSonarQubeEnv('sonarqube') {
                        sh(label: "🔍 Running SonarQube Analysis", script: """
                            ${SCANNER_HOME}/bin/sonar-scanner \\
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \\
                            -Dsonar.sources=. \\
                            -Dsonar.host.url=${SONARQUBE_URL} \\
                            -Dsonar.token=${SONAR_QUBE_TOKEN}
                        """)
                    }
                    waitForQualityGate(label: "⏳ Checking Quality Gate", abortPipeline: false, credentialsId: 'login-sonarqube')
                }
            }
        }

        stage('Scan Dependencies') {
            when {
                expression { return env.ONLY_JENKINSFILE_CHANGED != 'true' }
            }
            steps {
                script {
                    sh(label: "📦 Installing dependencies", script: "npm install")
                    sh(label: "🔍 Running security audit", script: "npm audit || true")
                    sh(label: "🔎 Running linter checks", script: "npm run lint || true")
                    
                    dependencyCheck(
                            additionalArguments: '''
                                -s.
                                -f HTML
                                --prettyPrint
                                --failOnCVSS 7
                                --enableRetired
                            ''',
                            odcInstallation: 'OWASP-Dependency-Check'
                        )

                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '',
                        reportFiles: 'dependency-check-report.html',
                        reportName: 'Dependency Check Report',
                        reportTitles: ''
                        ])

                    sh(label: "📊 Checking outdated packages", script: "npm outdated || true")
                    
                    def reportFilePath = 'dependency-check-report.html'
                    def criticalVuls = checkVulnerabilities(reportFilePath)
                    if (criticalVuls > 0) {
                        echo "⚠️ ${criticalVuls} critical vulnerabilities found!"
                    } else {
                        echo "✅ No critical vulnerabilities found"
                    }
                }
            }
        }

        stage('Trivy Filesystem Scan') {
            when {
                expression { return env.ONLY_JENKINSFILE_CHANGED != 'true' }
            }
            steps {
                script {
                    sh(label: "🔒 Running Filesystem Security Scan", script: """
                        docker run --rm -v trivy-db:/root/.cache/ aquasec/trivy fs --cache-dir /root/.cache/ --no-progress --exit-code 1 --severity HIGH,CRITICAL . > ${SCAN_OUTPUT}
                        cat ${SCAN_OUTPUT}
                    """)
                }
            }
        }

        stage('Build and Push Docker Images') {
            when {
                expression { return env.ONLY_JENKINSFILE_CHANGED != 'true' }
            }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'login-dockerhub', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh(label: "🔑 Authenticating with Docker Hub", script: 'echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin')
                    }
                    
                    if (env.BACKEND_CHANGES) {
                        def backendTag = "${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:v${BUILD_NUMBER}.0"
                        sh(label: "🏗️ Building backend image", script: "docker build -t ${backendTag} -f backend/Dockerfile .")
                        sh(label: "⬆️ Pushing backend image", script: "docker push ${backendTag}")
                        echo "✅ Backend image published successfully: ${backendTag}"
                    }
                    
                    if (env.APP_CHANGES) {
                        sh(label: "🏗️ Building app image", script: "docker build -t ${APP_TAG} .")
                        sh(label: "⬆️ Pushing app image", script: "docker push ${APP_TAG}")
                        echo "✅ App image published successfully: ${APP_TAG}"
                    }

                    if (!env.BACKEND_CHANGES && !env.APP_CHANGES) {
                        echo "ℹ️ No changes detected in any directory"
                    }
                }
            }
        }

        stage('Trivy Image Scan') {
            when {
                expression { return env.ONLY_JENKINSFILE_CHANGED != 'true' }
            }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'login-ghcr', usernameVariable: 'USR', passwordVariable: 'PSW')]) {
                        sh(label: "🔑 Authenticating with GitHub Container Registry", script: 'echo $PSW | docker login ghcr.io -u $USR --password-stdin')
                    }
                    
                    if (env.BACKEND_CHANGES) {
                        sh(label: "🔒 Scanning backend image", script: """
                            docker run --rm \\
                            -v /var/run/docker.sock:/var/run/docker.sock \\
                            -v trivy-db:/root/.cache/ \\
                            aquasec/trivy image \\
                            --cache-dir /root/.cache/ \\
                            --no-progress \\
                            --severity HIGH,CRITICAL \\
                            --ignore-unfixed \\
                            --timeout 45m \\
                            ${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG} > backend_${SCAN_OUTPUT} || true
                        """)
                        sh(label: "📄 Showing backend scan results", script: "cat backend_${SCAN_OUTPUT}")
                    }

                    if (env.APP_CHANGES) {
                        sh(label: "🔒 Scanning app image", script: """
                            docker run --rm \\
                            -v /var/run/docker.sock:/var/run/docker.sock \\
                            -v trivy-db:/root/.cache/ \\
                            aquasec/trivy image \\
                            --cache-dir /root/.cache/ \\
                            --no-progress \\
                            --severity HIGH,CRITICAL \\
                            --ignore-unfixed \\
                            --timeout 45m \\
                            ${DOCKER_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} > app_${SCAN_OUTPUT} || true
                        """)
                        sh(label: "📄 Showing app scan results", script: "cat app_${SCAN_OUTPUT}")
                    }

                    if (!env.BACKEND_CHANGES && !env.APP_CHANGES) {
                        echo "ℹ️ No images to scan"
                    }
                }
            }
        }
	
	stage('Cleanup Workspace Before Deploy') {
            when {
                expression { return env.ONLY_JENKINSFILE_CHANGED != 'true' }
            }
            steps {
                cleanWs()
            }
        }

        stage('Checkout Deploy') {
            when {
                expression { return env.ONLY_JENKINSFILE_CHANGED != 'true' }
            }
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: 'main']],
                    userRemoteConfigs: [
                        [
                            url: env.DEPLOY_SCM,
                            credentialsId: 'login-github'
                        ]
                    ]
                ])
            }
        }

        stage('Setup Git Configuration') {
            when {
                expression { return env.ONLY_JENKINSFILE_CHANGED != 'true' }
            }
            steps {
                script {
                    def currentBranch = sh(label: "🔍 Checking current branch", script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
                    
                    if (currentBranch != env.DEPLOY_BRANCH) {
                        echo "Current branch is ${currentBranch}. Switching to branch ${env.DEPLOY_BRANCH}."
                        sh(label: "🔄 Switching branch", script: "git checkout ${env.DEPLOY_BRANCH}")
                    }
                }
            }
        }

        stage('Deploy to Production') {
            when {
                expression { return env.ONLY_JENKINSFILE_CHANGED != 'true' }
            }
            steps {
                script {
                    if (env.BACKEND_CHANGES) {
                        sh(label: "🔄 Updating backend image tag", script: 'sed -i "s|${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:v[^ ]*|${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}|g" ${DEPLOYMENT_FILE}')
                    }
                    
                    if (env.APP_CHANGES) {
                        sh(label: "🔄 Updating app image tag", script: 'sed -i "s|${DOCKER_USER}/${DOCKER_IMAGE}:v[^ ]*|${DOCKER_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}|g" ${DEPLOYMENT_FILE}')
                    }
                    
                    sh(label: "📄 Showing deployment configuration", script: "cat ${DEPLOYMENT_FILE}")
                    
                    sh(label: "🚀 Pushing deployment changes", script: """
                        git add ${DEPLOYMENT_FILE}
                        git status
                        git commit -m "Update deployment file to use version ${DOCKER_TAG}"
                        git push origin ${DEPLOY_BRANCH}
                    """)
                }
            }
        }
    }

    post {
        always {
            script {
                if (env.ONLY_JENKINSFILE_CHANGED != 'true') {
                    sh(label: "🧹 Logging out from registries", script: """
                        docker logout
                        docker logout ghcr.io
                    """)
                    
                    try {
                        if (env.BACKEND_CHANGES) {
                            sh(label: "🗑️ Cleaning up old backend images", script: """
                                for tag in \$(docker images "${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}" --format "{{.Tag}}" | grep -v "${DOCKER_TAG}"); do
                                    echo "   Removing ${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:\$tag"
                                    docker rmi "${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:\$tag" || true
                                done
                            """)
                        }
                        if (env.APP_CHANGES) {
                            sh(label: "🗑️ Cleaning up old app images", script: """
                                for tag in \$(docker images "${DOCKER_USER}/${DOCKER_IMAGE}" --format "{{.Tag}}" | grep -v "${DOCKER_TAG}"); do
                                    echo "   Removing ${DOCKER_USER}/${DOCKER_IMAGE}:\$tag"
                                    docker rmi "${DOCKER_USER}/${DOCKER_IMAGE}:\$tag" || true
                                done
                            """)
                        }
                    } catch (err) {
                        echo "⚠️ Warning: Failed to clean up some Docker images: ${err.message}"
                    }
                }
            }
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
def checkVulnerabilities(reportFilePath)
{
    def criticalCount = 0
    def htmlContent = readFile(reportFilePath)

    if (htmlContent.contains("Critical"))
    {
        def matcher = (htmlContent = ~ /< td class= "severity" > Critical <\/ td >/)
        criticalCount = matcher.count
    }
    return criticalCount
}
