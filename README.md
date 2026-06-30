# CICD-Github
# Create a CI/CD pipeline using Githhub actions.

### 1. Build container image
### 2. Push image to container registry
### 3. Deploy to Kubernetes

Add a deploy.yaml configuration file inside the .github/workflows/ directory at the root of code repository
Steps: 
### 1. Create the Directories: At the root local of repository, create a directory structure matching .github/workflows/.
### 2  Create the Workflow File: Inside github/workflows/ folder, create a file named deploy.yml.
### 3. Configure the Secrets: Navigate to repository on GitHub → Settings → Secrets and variables → Actions
### 4. Click the New repository secret button and Name to: KUBERNETES_KUBECONFIG In the Value field, paste the complete raw text content of your local ~/.kube/config file and Click Add secret.
### 5. Add runner Settings ➔ Actions ➔ Runners ➔ New self-hosted runner on Github
### 6. Push any changes to trigger CI/CD pipeline or manually re-run jobs
### 7. Track live execution under the Actions tab on GitHub repository page.

### deploy.yaml
```
name: Build and Deploy Express App to K8s

on:
  push:
    branches:
      - main # Triggers the pipeline whenever code is pushed to the main branch

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}  

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      // # 1. CHECKOUT SOURCE CODE
      - name: Checkout Source Code
        uses: actions/checkout@v4

      // # 2. LOGIN TO GITHUB CONTAINER REGISTRY (GHCR)
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }} # Automatically provided by GitHub Actions

      // # 3. BUILD AND PUSH DOCKER IMAGE
      - name: Convert repository to lowercase
        run: |
          echo "IMAGE_NAME=${GITHUB_REPOSITORY,,}" >> ${GITHUB_ENV}
      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          // # Tags the image with 'latest' and the specific commit hash for easy rollbacks
          tags: |
            ghcr.io/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      // # 4. SETUP KUBECTL CLI
      - name: Setup Access to Kubernetes Cluster
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBERNETES_KUBECONFIG }}

      // # 5. DYNAMICALLY UPDATE THE MANIFEST IMAGE TAG
      - name: Update Deployment Manifest Image Tag
        run: |
          sed -i "s|image: node-app:v1.0.0|image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}|g" k8s/deployment.yaml
          sed -i "s|imagePullPolicy: Never|imagePullPolicy: Always|g" k8s/pipeline.yaml

      // # 6. DEPLOY FRESH MANIFESTS TO CLUSTER
      - name: Deploy Manifests to Cluster
          --validate=false

        run: |
          kubectl apply -f k8s/pipeline.yaml
          kubectl rollout status deployment/node-app-deployment
```
### pipeline.yaml
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-app-deployment
  labels:
    app: node-app
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: node-app
  template:
    metadata:
      labels:
        app: node-app
    spec:
      containers:
      - name: node-container
        #image: node-app:latest
        image: docker.io/prashantubale2019/cicd-github:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
        
        // # RESOURCE LIMITS & REQUESTS
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
       // # READINESS PROBE
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 5
          timeoutSeconds: 2
          successThreshold: 1
          failureThreshold: 3

       // # LIVENESS PROBE
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 2
          successThreshold: 1
          failureThreshold: 3

```
