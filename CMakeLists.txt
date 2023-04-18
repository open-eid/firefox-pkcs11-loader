cmake_minimum_required(VERSION 3.0)
project(firefox-pkcs11-loader VERSION 3.13.6 LANGUAGES NONE)

set(UUID "{02274e0c-d135-45f0-8a9c-32b35110e10d}" CACHE STRING "Extension UUID")
set(EXTENSIONS "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}" CACHE STRING "Firefox Extension Directory")
set(URL "https://addons.mozilla.org/firefox/downloads/latest/pkcs11-module-loader/latest.xpi" CACHE STRING "Mozilla AMO URL")
set(SIGNCERT "" CACHE STRING "Common name of certificate to used sign packages, empty skip signing")
set(USESIGNED YES CACHE BOOL "Use Mozilla signed extension")

add_custom_target(extension
    COMMENT "Create extension"
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/webextension
    COMMAND ${CMAKE_COMMAND} -E tar c ${PROJECT_BINARY_DIR}/${UUID}.xpi --format=zip .
)
if(${USESIGNED})
    file(DOWNLOAD ${URL} ${PROJECT_BINARY_DIR}/${UUID}.xpi)
endif()

if($ENV{BUILD_NUMBER})
    set(PKG_VERSION "${PROJECT_VERSION}.$ENV{BUILD_NUMBER}")
else()
    set(PKG_VERSION "${PROJECT_VERSION}")
endif()

set(CPACK_GENERATOR RPM)
set(CPACK_PACKAGE_CONTACT "RIA <info@ria.ee>")
set(CPACK_PACKAGE_VENDOR RIA)
set(CPACK_PACKAGING_INSTALL_PREFIX /usr)
set(CPACK_RPM_FILE_NAME RPM-DEFAULT)
set(CPACK_RPM_PACKAGE_REQUIRES opensc)
list(APPEND CPACK_RPM_EXCLUDE_FROM_AUTO_FILELIST_ADDITION
    /usr/lib/mozilla
    /usr/share/mozilla
    /usr/share/mozilla/extensions
    /usr/share/mozilla/extensions/${EXTENSIONS}
)
include(CPack)

include(GNUInstallDirs)
install(FILES ${PROJECT_BINARY_DIR}/${UUID}.xpi
        DESTINATION ${CMAKE_INSTALL_DATADIR}/mozilla/extensions/${EXTENSIONS})
install(FILES ${PROJECT_SOURCE_DIR}/onepinopenscpkcs11.json
        DESTINATION ${CMAKE_INSTALL_LIBDIR}/mozilla/pkcs11-modules)
install(FILES ${PROJECT_SOURCE_DIR}/idemiaawppkcs11.json
        DESTINATION ${CMAKE_INSTALL_LIBDIR}/mozilla/pkcs11-modules)
add_custom_target(installer
    COMMENT "Creating installer"
    WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}
    COMMAND dch --distribution unstable -v ${PROJECT_VERSION} "Release: ${PROJECT_VERSION}."
    COMMAND dpkg-buildpackage -rfakeroot -us -uc
)
