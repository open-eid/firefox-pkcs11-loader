cmake_minimum_required(VERSION 3.0)
project(firefox-pkcs11-loader VERSION 3.12.0 LANGUAGES NONE)

set(FF_MAX_VERSION "*" CACHE STRING "Firefox max version")
set(UUID "{aa84ce40-4253-a00a-8cd6-0800200f9a66}" CACHE STRING "Extension UUID")
set(XPI_STAGE ${CMAKE_CURRENT_BINARY_DIR}/${UUID})
set(SIGNCERT "" CACHE STRING "Common name of certificate to used sign packages, empty skip signing")

configure_file(install.rdf.in ${XPI_STAGE}/install.rdf)

add_custom_target(xpi
    ALL
    COMMENT "Staging xpi content"
    WORKING_DIRECTORY ${XPI_STAGE}
    COMMAND ${CMAKE_COMMAND} -E remove_directory chrome
    COMMAND ${CMAKE_COMMAND} -E remove           chrome.manifest
    COMMAND ${CMAKE_COMMAND} -E copy_directory   ${CMAKE_CURRENT_SOURCE_DIR}/chrome chrome
    COMMAND ${CMAKE_COMMAND} -E copy             ${CMAKE_CURRENT_SOURCE_DIR}/chrome.manifest .
)

add_custom_target(zip-xpi
    DEPENDS xpi
    COMMENT "Compressing xpi file"
    WORKING_DIRECTORY ${XPI_STAGE}
    COMMAND zip -D -r ${PROJECT_BINARY_DIR}/${PROJECT_NAME}_${PROJECT_VERSION}.xpi .
    COMMAND zip -D -r ${PROJECT_BINARY_DIR}/${UUID}.xpi .
)

if($ENV{BUILD_NUMBER})
    set(PKG_VERSION "${PROJECT_VERSION}.$ENV{BUILD_NUMBER}")
else()
    set(PKG_VERSION "${PROJECT_VERSION}")
endif()
if(APPLE)
    set(DST "/Library/Application Support/Mozilla/Extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/")
    install(DIRECTORY ${XPI_STAGE} DESTINATION ${DST})
    if(SIGNCERT)
        set(PKG_EXTRA --sign ${SIGNCERT})
    endif()
    add_custom_target(installer
        COMMENT "Creating installer"
        COMMAND mkdir -p "root/${DST}"
        COMMAND cp ${UUID}.xpi "root/${DST}"
        COMMAND pkgbuild --root root ${PKG_EXTRA} --version "${PKG_VERSION}$ENV{VER_SUFFIX}"
                --identifier "ee.ria.${PROJECT_NAME}" ${PROJECT_NAME}_${PKG_VERSION}$ENV{VER_SUFFIX}.pkg
    )
elseif(UNIX)
    include(GNUInstallDirs)
    install(DIRECTORY ${XPI_STAGE}
            DESTINATION "${CMAKE_INSTALL_DATADIR}/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/")
elseif(WIN32)
    install(DIRECTORY ${XPI_STAGE} DESTINATION ${CMAKE_INSTALL_PREFIX})
    set(OPENSC_PATH "" CACHE PATH "OpenSC Path to included in MSI installer")
    if(OPENSC_PATH)
        set(CANDLE_EXTRA " -dopensc_path=\"${OPENSC_PATH}\"")
    endif()
    set(MSI_FILE "${PROJECT_NAME}_${PKG_VERSION}$ENV{VER_SUFFIX}")
    add_custom_target(installer
        COMMENT "Creating installer"
        COMMAND "$ENV{WIX}bin\\candle.exe" -nologo -arch x86 -dPlatform=x86 "${CANDLE_EXTRA}" -dGUID="${UUID}"
            -dMSI_VERSION=${PKG_VERSION} ${CMAKE_SOURCE_DIR}/${PROJECT_NAME}.wxs
        COMMAND "$ENV{WIX}bin\\light.exe" -nologo -o "${MSI_FILE}.x86.msi" ${PROJECT_NAME}.wixobj -ext WixUIExtension
            -dWixUILicenseRtf=${CMAKE_SOURCE_DIR}/LICENSE.LGPL.rtf
            -dWixUIDialogBmp=${CMAKE_SOURCE_DIR}/dlgbmp.bmp
            -dWixUIBannerBmp=${CMAKE_SOURCE_DIR}/banner.bmp
        COMMAND "$ENV{WIX}bin\\candle.exe" -nologo -arch x64 -dPlatform=x64 "${CANDLE_EXTRA}" -dGUID="${UUID}"
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
