AZRO fast publish package — no Finder Merge prompt needed.

TEST PUBLISH TO https://zsend.github.io/AzroTest/
1. Make one empty folder named AZRO_SITE_TEST_READY_ROOT.
2. Open AZRO_FAST_PART_1_CORE_DOCS_COPY_CONTENTS_TO_PUBLISH_ROOT and copy EVERYTHING INSIDE it into AZRO_SITE_TEST_READY_ROOT.
3. Open AZRO_FAST_PART_2_MEDIA_COPY_CONTENTS_TO_PUBLISH_ROOT and copy EVERYTHING INSIDE it into the SAME AZRO_SITE_TEST_READY_ROOT folder.
4. Publish the CONTENTS of AZRO_SITE_TEST_READY_ROOT to the AzroTest repo/site.

PRODUCTION PUBLISH TO azrosystems.com
1. After the test passes, duplicate AZRO_SITE_TEST_READY_ROOT.
2. Copy the two files inside AZRO_PRODUCTION_AZROSYSTEMS_COM_COPY_AFTER_TEST into the duplicated root folder, replacing robots.txt and adding CNAME.
3. Publish the CONTENTS of that duplicated root folder to azrosystems.com.

Do not click Replace on an existing site folder. Use a clean folder/repo so old direct PDF/XLSX URLs cannot survive.
