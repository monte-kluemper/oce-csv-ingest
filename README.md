# Tool to ingest content from a CSV file

This tool will allow you to create new content items from data in a CSV file.


# Step 1: Install

npm install

Test that the install worked by calling the cli like this:

node src/cli.js --help


# Step 2: Generate OAuth Token

./node_modules/.bin/oce-management login-oauth -h <server> -c <client-id> -s<secret> -x<scope> -u<username>

Example values:
 -h https://oceinstance-ocedomain.cec.ocp.oraclecloud.com
 -c 1234567890abcdef123456789
 -s 1234567-abcd-abcd-abcd-1234567890
 -x https://idcsinstanceid-ocedomain.cec.ocp.oraclecloud.com:443/urn:opc:cec:all
 -u john.smith@oracle.com

More information is available in the documented instructions on how to obtain a OAuth token by setting up an OAuth application in IDCS.  If the command is successful, you should see this message in the console:

"Credentials and token are persisted to .oce-auth-config.enc and .oce-token.enc."


# Step 3: Get the target Repository ID from OCE

This is available in the OCE console if you look at any Asset Mgmt API data that is returned, for example.  You will need this value for every call to ingest content.


# Step 4: Create a CSV file with comma-delimited values and a header row

Here's an example file format for "Malls":

id,mall_name,city,address,phone,
mall0001,Yellow Mall Madrid,Madrid,Plaza Mayor,9101010101,
mall0002,Yellow Mall Getafe,Getafe,Plaza Mayor,9102020202,
mall0003,Yellow Mall Toledo,Toledo,Plaza Mayor,9103030303,

The header field values should use the same names as your target fields in OCE.  Every required field in OCE should have a corresponding column in the CSV file.

By default, all fields are of type string.  However, you can force a field to be of particular type by adding a suffix in the header row like this:

id,mall_name,city,address,phone:n,sales:f,

The list of valid field types and their suffix values is:
 -s = string (default)
 -n = number / integer
 -f = float / decimal
 -b = boolean
 -d = datetime

The 'id' field is a special field that can be used to define relationships between content types to be uploaded.  For example, if you want to upload "Brands" that are related to a particular Mall, you can set a reference field such as "mall" as part of the brand definition that refers to a Mall asset.  In the CSV for the list of malls, you should create a unique ID for each mall.  Then, in the CSV for each store, you will need to have a column that represents the reference asset.  This is done by setting the field type to the name of the reference content type and using an '@' character to indicate that this is a reference field.  For example, a sample XLS for brands might look like this:

id,mall:@Mall,brand_name,details,phone,
b001,mall0001,Banana Yellow Madrid,Details for Banana Yellow Brand,912312321,
b002,mall0002,Banana Yellow Getafe,Details for Banana Yellow Brand,923232323,
b003,mall0002,Lemon Yellow,Details for Lemon Yellow Brand,934343434,

In this case, references to the Mall field 'mall0001' in the brands will be the "Yellow Mall Madrid" asset defined in the Mall CSV example above.  This mapping requires that the Mall CSV be processed before the brands CSV.  The mapping of these ID relationships to the actual GUIDs of the assets in OCE is maintained in CSV files in the /ref subfolder.  You can also hardcode the actual GUIDs from the OCE repository in this column (36 characters, starting with "CORE" or "CONT") which can refer to either media fields or another content type.  A hardcoded reference value will take precedence over the reference file mapping.

One important limitation of the tool when using reference fields is that you are required to specify a single content type for each reference field.  This is not a product limitation, as OCE allows you to define reference fields that allow any number of content types as references.

Another limitation of the tool is that there is no logic for uploading multiple values of a multi-value field.

When constructing the CSV file, keep in mind that the upload logic uses the first string column in the CSV (ignoring the id column) as the name.  In the preceding example, the name of the asset for each brand uploaded will be the value of the column 'brand_name', since we ignore the ID column and the Mall column is a reference, not a string.


# Step 5: Execute the process to ingest the CSV file

There is an "ingestAssets" command in the CLI that connects and creates the content assets.

Format:  node src/cli.js ingestAssets -r <repository-id> -c <contentType> [-l <locale (def:  en-US)> -t -v -a] <csv-file>

-t should be sent only if you don't want the content to be translated
-v should be sent if the assets to be uploaded are variants to a master asset
-a should be sent only if you do not want to delete previous references in the reference file for this content type.


Example 1:  Upload master assets that are translatable (in English)

node src/cli.js ingestAssets -r ABCDEFG0123456789BCDEFG -c Mall -t malls.csv

A reference file will be created that can be used for linking these assets to other assets.  It can also be used by variants as the master language.


Example 2:  Upload variant assets

node src/cli.js ingestAssets -r ABCDEFG0123456789BCDEFG -c Mall -l es -v true malls.csv

A reference file is not created for variant uploads.

#
# OTHER MIGRATION SERVICES
#

# Generate Reference File

This service allows you to explicitly generate a reference file from assets that have already been uploaded into the repository.  These reference files can be used when uploading other content types to auto-populate reference fields.

Format:  node src/cli.js generateReferenceFile -r <repository-id> -c <contentType> [-k <key = id(def)|name|slug|sequence>]

-k this is the key that will be used in other uploaded files to create the reference.  Valid values are id (default), name, slug and a generated sequence

This service can be used, for example, to export a set of references for images uploaded directly into the repository.  If the images have unique filenames, the filenames "name" can be used as the reference ID.  The other ingested files would only have to make reference to this name.

# Export Content To CSV

This service allows you to export assets to a CSV file that can be ingested via the ingest command.

Format:  node src/cli.js exportContentToCSV -r <repository-id> -c <contentType>

One important note on the generated file is that OCE doesn't limit references fields to be of a single type.  If the field is not restricted, the header row will indicate this field mapping as "null".  The ingest process only searches for references of a single type, so you will need to split the file into different files for processing if you need to import with different reference types.
