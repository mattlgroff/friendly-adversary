import subprocess

source = input()
eval(source)
subprocess.run(source, shell=True)
