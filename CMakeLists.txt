cmake_minimum_required(VERSION 3.0)
project(firefox-pkcs11-loader VERSION 3.13.4 LANGUAGES NONE)

set(UUID "{02274e0c-d135-45f0-8a9c-32b35110e10d}" CACHE STRING "Extension UUID")
set(URL "https://addons.mozilla.org/firefox/downloads/latest/pkcs11-module-loader/latest.xpi" CACHE STRING "Mozilla AMO URL")
set(SIGNCERT "" CACHE STRING "Common name of certificate to used sign packages, empty skip signing")

add_custom_target(extension
    COMMENT "Create extension"
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/webextension
    COMMAND zip -D -r ${PROJECT_BINARY_DIR}/${UUID}.xpi .
)

if($ENV{BUILD_NUMBER})
    set(PKG_VERSION "${PROJECT_VERSION}.$ENV{BUILD_NUMBER}")
else()
    set(PKG_VERSION "${PROJECT_VERSION}")
endif()
if(APPLE)
    configure_file(${PROJECT_SOURCE_DIR}/macos-postinstall.in ${PROJECT_BINARY_DIR}/scripts/postinstall @ONLY)
    install(FILES ${PROJECT_SOURCE_DIR}/onepinopenscpkcs11-mac.json RENAME onepinopenscpkcs11.json
        DESTINATION "/Library/Application Support/Mozilla/PKCS11Modules")
    install(FILES ${PROJECT_SOURCE_DIR}/idemiaawppkcs11-mac.json RENAME idemiaawppkcs11.json
        DESTINATION "/Library/Application Support/Mozilla/PKCS11Modules")
    if(SIGNCERT)
        set(PKG_EXTRA --sign ${SIGNCERT})
    endif()
    add_custom_target(installer
        COMMENT "Creating installer"
        COMMAND make install DESTDIR=root
        COMMAND pkgbuild --root root --scripts scripts ${PKG_EXTRA} --version "${PKG_VERSION}$ENV{VER_SUFFIX}"
                --identifier "ee.ria.${PROJECT_NAME}" ${PROJECT_NAME}_${PKG_VERSION}$ENV{VER_SUFFIX}.pkg
    )
elseif(UNIX)
    include(GNUInstallDirs)
    install(FILES ${PROJECT_BINARY_DIR}/${UUID}.xpi
            DESTINATION "${CMAKE_INSTALL_DATADIR}/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/")
    install(FILES ${PROJECT_SOURCE_DIR}/onepinopenscpkcs11.json
            DESTINATION "${CMAKE_INSTALL_LIBDIR}/mozilla/pkcs11-modules")
    install(FILES ${PROJECT_SOURCE_DIR}/idemiaawppkcs11.json
            DESTINATION "${CMAKE_INSTALL_LIBDIR}/mozilla/pkcs11-modules")
    add_custom_target(installer
        COMMENT "Creating installer"
        WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}
        COMMAND dh_make --createorig --addmissing --defaultless -y -p ${PROJECT_NAME}_${PROJECT_VERSION}
        COMMAND dch --distribution unstable -v ${PROJECT_VERSION} "Release: ${PROJECT_VERSION}."
        COMMAND dpkg-buildpackage -rfakeroot -us -uc
    )
elseif(WIN32)
    set(OPENSC_PATH "" CACHE PATH "OpenSC Path to included in MSI installer")
    if(OPENSC_PATH)
        set(CANDLE_EXTRA " -dopensc_path=\"${OPENSC_PATH}\"")
    endif()
    set(MSI_FILE "${PROJECT_NAME}_${PKG_VERSION}$ENV{VER_SUFFIX}")
    add_custom_target(installer
        COMMENT "Creating installer"
        COMMAND "$ENV{WIX}bin\\candle.exe" -nologo -arch x86 -dPlatform=x86 "${CANDLE_EXTRA}" -dsrc="${PROJECT_SOURCE_DIR}" -dURL="${URL}"
            -dMSI_VERSION=${PKG_VERSION} ${CMAKE_SOURCE_DIR}/${PROJECT_NAME}.wxs
        COMMAND "$ENV{WIX}bin\\light.exe" -nologo -o "${MSI_FILE}.x86.msi" ${PROJECT_NAME}.wixobj -ext WixUIExtension
            -dWixUILicenseRtf=${CMAKE_SOURCE_DIR}/LICENSE.LGPL.rtf
            -dWixUIDialogBmp=${CMAKE_SOURCE_DIR}/dlgbmp.bmp
            -dWixUIBannerBmp=${CMAKE_SOURCE_DIR}/banner.bmp
        COMMAND "$ENV{WIX}bin\\candle.exe" -nologo -arch x64 -dPlatform=x64 "${CANDLE_EXTRA}" -dsrc="${PROJECT_SOURCE_DIR}" -dURL="${URL}"
            -dMSI_VERSION=${PKG_VERSION} ${CMAKE_SOURCE_DIR}/${PROJECT_NAME}.wxs
        COMMAND "$ENV{WIX}bin\\light.exe" -nologo -o "${MSI_FILE}.x64.msi" ${PROJECT_NAME}.wixobj -ext WixUIExtension
            -dWixUILicenseRtf=${CMAKE_SOURCE_DIR}/LICENSE.LGPL.rtf
            -dWixUIDialogBmp=${CMAKE_SOURCE_DIR}/dlgbmp.bmp
            -dWixUIBannerBmp=${CMAKE_SOURCE_DIR}/banner.bmp
    )
    if(SIGNCERT)
        add_custom_command(TARGET installer POST_BUILD
            COMMAND signtool.exe sign /a /v /s MY /n "${SIGNCERT}" /fd SHA256
                /du http://installer.id.ee /tr http://sha256timestamp.ws.symantec.com/sha256/timestamp /td SHA256
                "${MSI_FILE}.x64.msi" "${MSI_FILE}.x86.msi"
        )
    endif()
endif()
