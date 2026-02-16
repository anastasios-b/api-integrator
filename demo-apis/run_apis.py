import subprocess
import sys
import time
import signal
import os
import atexit
import importlib.metadata
from pathlib import Path

def install_requirements():
    """Install required packages from requirements.txt if not already installed."""
    script_dir = Path(__file__).parent
    venv_pip = script_dir / 'venv' / 'bin' / 'pip'
    
    requirements = {}
    with open('requirements.txt') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                pkg_name = line.strip().split('==')[0].lower()
                requirements[pkg_name] = line.strip()

    missing = []
    for pkg_name in requirements.keys():
        try:
            importlib.metadata.version(pkg_name)
        except importlib.metadata.PackageNotFoundError:
            missing.append(requirements[pkg_name])

    if missing:
        print("Installing missing dependencies...")
        subprocess.check_call([str(venv_pip), "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully!")

# Store references to the subprocesses
processes = []

def cleanup():
    """Cleanup function to terminate all subprocesses."""
    print("\nCleaning up API servers...")
    for p in processes:
        try:
            p.terminate()  # Try to terminate gracefully
            p.wait(timeout=2)  # Wait up to 2 seconds
        except:
            try:
                # Force kill if still running
                p.kill()
            except:
                pass
    print("All API servers have been stopped.")

# Register cleanup to run on normal program exit
atexit.register(cleanup)

def start_apis():
    """Start all three API servers in separate processes."""
    # Install requirements first
    install_requirements()
    
    print("Starting API servers...")
    
    # Get the directory containing this script
    script_dir = Path(__file__).parent
    
    try:
        # Use virtual environment python
        venv_python = script_dir / 'venv' / 'bin' / 'python'
        
        # Start API 1 on port 8081
        api1 = subprocess.Popen(
            [str(venv_python), str(script_dir / 'api_1.py')],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        processes.append(api1)
        print(f"API 1 started (PID: {api1.pid}) - http://localhost:8081")
        
        # Start API 2 on port 8082
        api2 = subprocess.Popen(
            [str(venv_python), str(script_dir / 'api_2.py')],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        processes.append(api2)
        print(f"API 2 started (PID: {api2.pid}) - http://localhost:8082")
        
        # Start API 3 on port 8083
        api3 = subprocess.Popen(
            [str(venv_python), str(script_dir / 'api_3.py')],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        processes.append(api3)
        print(f"API 3 started (PID: {api3.pid}) - http://localhost:8083")
        
        # Print output from the processes
        print("\n=== API Output (Ctrl+C to stop all servers) ===\n")
        
        # Function to handle termination signals
        def signal_handler(sig, frame):
            print("\nReceived termination signal. Stopping all API servers...")
            cleanup()
            sys.exit(0)
            
        # Set up signal handlers for termination
        signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
        signal.signal(signal.SIGTERM, signal_handler)  # kill command
        if hasattr(signal, 'SIGHUP'):
            signal.signal(signal.SIGHUP, signal_handler)  # Terminal closed
        
        # Keep the script running and show output
        while True:
            for p in processes:
                output = p.stdout.readline()
                if output:
                    print(f"[API {processes.index(p) + 1}] {output.strip()}")
            time.sleep(0.1)
            
    except Exception as e:
        print(f"Error starting APIs: {e}")
        for p in processes:
            try:
                p.terminate()
            except:
                pass
        sys.exit(1)

if __name__ == "__main__":
    start_apis()
