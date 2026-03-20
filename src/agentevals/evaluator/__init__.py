"""Evaluator management: sources, templates, and resolution."""

from .resolver import EvaluatorResolver, get_default_resolver
from .sources import (
    BuiltinEvaluatorSource,
    EvaluatorInfo,
    EvaluatorSource,
    FileEvaluatorSource,
    GitHubEvaluatorSource,
    get_sources,
)
from .templates import scaffold_evaluator

__all__ = [
    "BuiltinEvaluatorSource",
    "EvaluatorInfo",
    "EvaluatorResolver",
    "EvaluatorSource",
    "FileEvaluatorSource",
    "GitHubEvaluatorSource",
    "get_default_resolver",
    "get_sources",
    "scaffold_evaluator",
]
