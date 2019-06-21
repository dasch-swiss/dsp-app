module.exports = {
    "dataSource": "prs",
    "prefix": "",
    "changelogFilename": "CHANGELOG.md",
    "ignoreIssuesWith": [
        "duplicate",
        "wontfix",
        "invalid",
        "help wanted",
        "question",
        "testing",
        "test"
    ],
    "template": {
        "issue": "- [{{text}}]({{url}}) {{name}}"
    },
    "groupBy": {
        "Enhancements:": ["enhancement", "feat"],
        "Bug Fixes:": ["fix", "bug", "invalid"],
        "Documentation:": ["docs", "documentation", "manual"],
        "Styling:": ["styling", "style"],
        "Other": ["chore", "refactor"]
    }
};