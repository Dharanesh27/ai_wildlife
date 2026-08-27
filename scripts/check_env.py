import sys
import socket
import subprocess

def check_command(cmd):
    try:
        subprocess.run([cmd, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except FileNotFoundError:
        return False

def check_port(host, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        try:
            s.connect((host, port))
            return True
        except (socket.timeout, ConnectionRefusedError):
            return False

def main():
    print("=" * 50)
    print("AI Wildlife System - Local Environment Pre-flight Check")
    print("=" * 50)

    # 1. Check CLI tools
    docker_ok = check_command("docker")
    docker_compose_ok = check_command("docker-compose") or check_command("docker")
    node_ok = check_command("node")
    npm_ok = check_command("npm")
    python_ok = True  # We are running it

    print(f"Docker:          {'[OK]' if docker_ok else '[MISSING] (Install Docker Desktop)'}")
    print(f"Docker Compose:  {'[OK]' if docker_compose_ok else '[MISSING]'}")
    print(f"Node.js:         {'[OK]' if node_ok else '[MISSING] (Install Node.js for frontend)'}")
    print(f"npm:             {'[OK]' if npm_ok else '[MISSING]'}")
    print(f"Python:          [OK] (Version {sys.version.split()[0]})")
    print("-" * 50)

    # 2. Check local database ports if Docker is missing
    print("Checking local database services ports (if running outside Docker):")
    pg_ok = check_port("localhost", 5432)
    mongo_ok = check_port("localhost", 27017)
    redis_ok = check_port("localhost", 6379)

    print(f"PostgreSQL (5432): {'[ACTIVE]' if pg_ok else '[INACTIVE]'}")
    print(f"MongoDB (27017):   {'[ACTIVE]' if mongo_ok else '[INACTIVE]'}")
    print(f"Redis (6379):      {'[ACTIVE]' if redis_ok else '[INACTIVE]'}")
    print("=" * 50)

    if not docker_ok:
        print("RECOMMENDATION:")
        print("To run the full suite easily with one command, download and start Docker Desktop:")
        print("Link: https://www.docker.com/products/docker-desktop/")
        print("")
        print("If you prefer to run services individually without Docker:")
        print("1. Start your local Postgres, MongoDB, and Redis instances.")
        print("2. Run the Next.js frontend in one terminal (npm run dev inside 'frontend').")
        print("3. Run the FastAPI backend in another terminal (uvicorn app.main:app inside 'backend').")
        print("Note: The frontend supports 'Demo Sandbox' mode to explore without any running databases!")
    else:
        print("Docker is installed. If the command failed, verify that the Docker Desktop app is running.")

if __name__ == "__main__":
    main()
