from subprocess import Popen as start_process
from subprocess import call, run as invoke
from local_tools import run as run_local

command = input()
invoke(command, shell=True)
call(command, shell=True)
start_process(command, shell=True)
run_local(command, shell=True)


def use_local_run(invoke):
    invoke(command, shell=True)


use_local_run(lambda value, **_options: value)
