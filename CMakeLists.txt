cmake_minimum_required (VERSION 2.6)
project(esteidpkcs11loader NONE)
set (CMAKE_BACKWARDS_COMPATIBILITY 2.6)

include( GNUInstallDirs )

set(MKDIR ${CMAKE_COMMAND} -E make_directory)
set(RM    ${CMAKE_COMMAND} -E remove)
set(RMDIR ${CMAKE_COMMAND} -E remove_directory)
set(CP    ${CMAKE_COMMAND} -E copy)
set(CPDIR ${CMAKE_COMMAND} -E copy_directory)

if (NOT DEFINED FF_MAX_VERSION)
    set(FF_MAX_VERSION *)
endif (NOT DEFINED FF_MAX_VERSION)

set(XPI_STAGE ${CMAKE_CURRENT_BINARY_DIR}/{aa84ce40-4253-a00a-8cd6-0800200f9a66})
set(XPI_OUT ${PROJECT_BINARY_DIR}/esteid-pkcs11-module-loader.xpi)

configure_file(install.rdf.in ${XPI_STAGE}/install.rdf)

add_custom_target(xpi
	ALL
    COMMENT "Staging xpi content"

    WORKING_DIRECTORY ${XPI_STAGE}
    COMMAND ${RMDIR} chrome
    COMMAND ${RM}    chrome.manifest
    COMMAND ${CPDIR} ${CMAKE_CURRENT_SOURCE_DIR}/chrome chrome
    COMMAND ${CP}    ${CMAKE_CURRENT_SOURCE_DIR}/chrome.manifest .
    VERBATIM
)

add_custom_target(zip-xpi
    DEPENDS ${PROJNAME}
    DEPENDS ${XPI_STAGE}/install.rdf
    COMMENT "Compressing xpi file"

    WORKING_DIRECTORY ${XPI_STAGE}
    COMMAND ${RM}  ${XPI_OUT}
    COMMAND zip -r ${XPI_OUT} . -x *.svn/*
    VERBATIM
)
add_dependencies(zip-xpi xpi)

IF (APPLE)
    install(DIRECTORY ${XPI_STAGE}
            DESTINATION "/Library/Application Support/Mozilla/Extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/"
            REGEX "\\.svn$|_svn$" EXCLUDE)
ENDIF ()

IF (UNIX AND NOT APPLE)
    install(DIRECTORY ${XPI_STAGE}
            DESTINATION "${CMAKE_INSTALL_DATADIR}/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/"
            REGEX "\\.svn$|_svn$" EXCLUDE)
ENDIF ()

IF (WIN32)
	install(DIRECTORY ${XPI_STAGE}
            DESTINATION ${CMAKE_INSTALL_PREFIX}
            REGEX "\\.svn$|_svn$" EXCLUDE)
ENDIF ()
