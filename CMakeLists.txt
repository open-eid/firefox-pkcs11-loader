cmake_minimum_required(VERSION 3.0)
set(BUILD_VER 0)
if($ENV{BUILD_NUMBER})
    set(BUILD_VER $ENV{BUILD_NUMBER})
endif()
project(firefox-pkcs11-loader VERSION 3.11.0.${BUILD_VER} LANGUAGES NONE)

set(FF_MAX_VERSION "*" CACHE STRING "Firefox max version")
set(UUID "{aa84ce40-4253-a00a-8cd6-0800200f9a66}" CACHE STRING "Extension UUID")
set(XPI_STAGE ${CMAKE_CURRENT_BINARY_DIR}/${UUID})
set(OPENSC_PATH "" CACHE PATH "OpenSC Path")

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

if(APPLE)
    set(DST "/Library/Application Support/Mozilla/Extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/")
    install(DIRECTORY ${XPI_STAGE} DESTINATION ${DST})
    add_custom_target(installer
        COMMENT "Creating installer"
        COMMAND mkdir -p "root/${DST}"
        COMMAND cp ${UUID}.xpi "root/${DST}"
        COMMAND pkgbuild --root root --sign "${SIGNCERT}" --version "${PROJECT_VERSION}$ENV{VER_SUFFIX}"
                --identifier "ee.ria.${PROJECT_NAME}" ${PROJECT_NAME}_${PROJECT_VERSION}$ENV{VER_SUFFIX}.pkg
    )
elseif(UNIX)
    include(GNUInstallDirs)
    install(DIRECTORY ${XPI_STAGE}
            DESTINATION "${CMAKE_INSTALL_DATADIR}/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/")
elseif(WIN32)
    install(DIRECTORY ${XPI_STAGE} DESTINATION ${CMAKE_INSTALL_PREFIX})
    if(OPENSC_PATH)
        set(CANDLE_EXTRA " -dopensc_path=\"${OPENSC_PATH}\"")
    endif()
    set(MSI_FILE "${PROJECT_NAME}_${PROJECT_VERSION}$ENV{VER_SUFFIX}")
    add_custom_target(installer
        COMMENT "Creating installer"
        COMMAND "$ENV{WIX}bin\\candle.exe" -nologo -arch x86 -dPlatform=x86 "${CANDLE_EXTRA}" -dGUID="${UUID}"
            -dMSI_VERSION=${PROJECT_VERSION} ${CMAKE_SOURCE_DIR}/firefox-pkcs11-loader.wxs
        COMMAND "$ENV{WIX}bin\\light.exe" -nologo -o "${MSI_FILE}.x86.msi" firefox-pkcs11-loader.wixobj -ext WixUIExtension
        COMMAND "$ENV{WIX}bin\\candle.exe" -nologo -arch x64 -dPlatform=x64 "${CANDLE_EXTRA}" -dGUID="${UUID}"
            -dMSI_VERSION=${PROJECT_VERSION} ${CMAKE_SOURCE_DIR}/firefox-pkcs11-loader.wxs
        COMMAND "$ENV{WIX}bin\\light.exe" -nologo -o "${MSI_FILE}.x64.msi" firefox-pkcs11-loader.wixobj -ext WixUIExtension
    )
    if(SIGNCERT)
        add_custom_command(TARGET installer POST_BUILD
            COMMAND signtool.exe sign /a /v /s MY /n "${SIGNCERT}" /fd SHA256
                /du http://installer.id.ee /t http://timestamp.verisign.com/scripts/timstamp.dll
                "${MSI_FILE}.x64.msi" "${MSI_FILE}.x86.msi"
        )
    endif()
endif()
