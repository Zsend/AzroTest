#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -d AZRO_SITE_TEST_READY_ROOT ]; then
  echo "AZRO_SITE_TEST_READY_ROOT not found. Run MAKE_TEST_FOLDER.command first or create it manually."
  exit 1
fi
rm -rf AZRO_SITE_PRODUCTION_READY_ROOT
ditto AZRO_SITE_TEST_READY_ROOT AZRO_SITE_PRODUCTION_READY_ROOT
ditto "AZRO_PRODUCTION_AZROSYSTEMS_COM_COPY_AFTER_TEST" AZRO_SITE_PRODUCTION_READY_ROOT
echo "Done. Publish the CONTENTS of AZRO_SITE_PRODUCTION_READY_ROOT to azrosystems.com"
