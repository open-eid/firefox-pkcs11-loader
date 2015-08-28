cmake_minimum_required(VERSION 2.8)
project(esteidpkcs11loader NONE)

set(FF_MAX_VERSION "*" CACHE STRING "Firefox max version")
set(VERSION "3.11.0" CACHE STRING "Version number")
set(UUID "{aa84ce40-4253-a00a-8cd6-0800200f9a66}" CACHE STRING "Extension UUID")
set(XPI_STAGE ${CMAKE_CURRENT_BINARY_DIR}/${UUID})
set(XPI_OUT ${PROJECT_BINARY_DIR}/esteid-pkcs11-module-loader_${VERSION}.xpi)

configure_file(install.rdf.in ${XPI_STAGE}/install.rdf)

add_custom_target(xpi
    ALL
    COMMENT "Staging xpi content"
    WORKING_DIRECTORY ${XPI_STAGE}
    COMMAND ${CMAKE_COMMAND} -E remove_directory chrome
    COMMAND ${CMAKE_COMMAND} -E remove           chrome.manifest
    COMMAND ${CMAKE_COMMAND} -E copy_directory   ${CMAKE_CURRENT_SOURCE_DIR}/chrome chrome
    COMMAND ${CMAKE_COMMAND} -E copy             ${CMAKE_CURRENT_SOURCE_DIR}/chrome.manifest .
    VERBATIM
)

add_custom_target(zip-xpi
    DEPENDS xpi
    COMMENT "Compressing xpi file"
    WORKING_DIRECTORY ${XPI_STAGE}
    COMMAND zip -r ${XPI_OUT} .
    VERBATIM
)

if(APPLE)
    install(DIRECTORY ${XPI_STAGE}
            DESTINATION "/Library/Application Support/Mozilla/Extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/"
            REGEX "\\.svn$|_svn$" EXCLUDE)
elseif(UNIX)
    include(GNUInstallDirs)
    install(DIRECTORY ${XPI_STAGE}
            DESTINATION "${CMAKE_INSTALL_DATADIR}/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/"
            REGEX "\\.svn$|_svn$" EXCLUDE)
elseif(WIN32)
    install(DIRECTORY ${XPI_STAGE}
            DESTINATION ${CMAKE_INSTALL_PREFIX}
            REGEX "\\.svn$|_svn$" EXCLUDE)
endif()
