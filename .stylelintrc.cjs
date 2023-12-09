module.exports = {
  "extends": ["stylelint-config-standard"],
  "ignoreFiles": ["static/**/*"],
  "rules": {
    "selector-class-pattern": null,
    "selector-pseudo-class-no-unknown": [
      true,
      {
        "ignorePseudoClasses": ["global"]
      }
    ],
    "selector-id-pattern": null,
    "no-descending-specificity": null,
    "property-no-vendor-prefix": null,
  }
}
