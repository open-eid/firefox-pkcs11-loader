# Firefox PKCS11 Loader

![European Regional Development Fund](https://github.com/e-gov/RIHA-Frontend/raw/master/logo/EU/EU.png "European Regional Development Fund - DO NOT REMOVE THIS IMAGE BEFORE 05.03.2020")

 * License: LGPL 2.1
 * &copy; Estonian Information System Authority

## Building
[![Build Status](https://travis-ci.org/open-eid/firefox-pkcs11-loader.svg?branch=master)](https://travis-ci.org/open-eid/firefox-pkcs11-loader)
[![Build Status](https://ci.appveyor.com/api/projects/status/github/open-eid/firefox-pkcs11-loader?branch=master&svg=true)](https://ci.appveyor.com/project/open-eid/firefox-pkcs11-loader)
        
### Widnows/OSX/Ubuntu

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
Official builds are provided through official distribution point [installer.id.ee](https://installer.id.ee). If you want support, you need to be using official builds. Contact our support via [www.id.ee](http://www.id.ee) for assistance.

Source code is provided on "as is" terms with no warranty (see license for more information). Do not file Github issues with generic support requests.
