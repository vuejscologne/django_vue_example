import os
import typer
import shutil
import webbrowser
import subprocess

from pathlib import Path
from functools import wraps

app = typer.Typer()


def typer_cli(f):
    # @app.command() does not work, dunno why
    @wraps(f)
    def wrapper():
        return typer.run(f)

    return wrapper


def print_styled_command(command):
    typer.echo(
        typer.style(
            "Running command line:",
            fg=typer.colors.WHITE,
            bg=typer.colors.GREEN,
            bold=True,
        )
    )
    typer.echo(typer.style(" ".join(command), bold=True) + "\n")


def run_command(command, debug=False, cwd=None, env=None):
    command = command.split()
    if debug:
        print_styled_command(command)
    subprocess.run(command, cwd=cwd, env=env)


@typer_cli
def pytest(test_path: str = typer.Argument(None)):
    command = "pytest"
    if test_path is not None:
        command = f"{command} {test_path}"
    run_command(command, debug=True)


@typer_cli
def flake8():
    command = "flake8 apps"
    run_command(command, debug=True)


@typer_cli
def black():
    command = "black apps"
    run_command(command, debug=True)


@typer_cli
def coverage():
    commands = [
        "coverage run --source apps --branch -m pytest .",
        "coverage report -m",
        "coverage html",
    ]
    for command in commands:
        run_command(command, debug=True)
    file_url = "file://" + str(Path("htmlcov/index.html").resolve())
    webbrowser.open_new_tab(file_url)


@typer_cli
def clean_pyc():
    commands = [
        "find . -name '*.pyc' -exec rm -f {} +",
        "find . -name '*.pyo' -exec rm -f {} +",
        "find . -name '*~' -exec rm -f {} +",
    ]
    for command in commands:
        run_command(command, debug=True)


@typer_cli
def clean():
    clean_pyc()


@typer_cli
def docs():
    commands = [
        "sphinx-apidoc -o docs/",
        "make -C docs clean",
        "make -C docs html",
    ]
    for command in commands:
        run_command(command, debug=True)
    file_url = "file://" + str(Path("docs/_build/html/index.html").resolve())
    webbrowser.open_new_tab(file_url)


@typer_cli
def notebook():
    env = os.environ.copy()
    env["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
    command = "python ../manage.py shell_plus --settings config.settings.local --notebook"
    run_command(command, cwd="notebooks", debug=True, env=env)
