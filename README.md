# Firefox PKCS11 Loader

![European Regional Development Fund](https://github.com/open-eid/DigiDoc4-Client/blob/master/client/images/EL_Regionaalarengu_Fond.png "European Regional Development Fund - DO NOT REMOVE THIS IMAGE BEFORE 05.03.2020")

**NB! Please note that the active development and management of the Firefox PKCS11 Loader component has ended due to the transition to the OpenSC pkcs11-register tool.
We won't be accepting pull requests or responding to issues for this project anymore.**

* License: LGPL 2.1
* &copy; Estonian Information System Authority

## Building

[![Build Status](https://github.com/open-eid/firefox-pkcs11-loader/workflows/CI/badge.svg?branch=master)](https://github.com/open-eid/firefox-pkcs11-loader/actions)

### Ubuntu

1. Fetch the source

        git clone https://github.com/open-eid/firefox-pkcs11-loader
        cd firefox-pkcs11-loader

2. Configure

        mkdir build
        cd build
        cmake ..

3. Build

        make extension
        make installer

4. Install the package and execute Firefox

## Support

Official builds are provided through official distribution point [id.ee](https://www.id.ee/en/article/install-id-software/). If you want support, you need to be using official builds. Contact our support via [www.id.ee](http://www.id.ee) for assistance.

Source code is provided on "as is" terms with no warranty (see license for more information). Do not file Github issues with generic support requests.
