/*
 * Estonian ID card plugin for web browsers
 *
 * Copyright (C) 2010-2011 Codeborne <info@codeborne.com>
 *
 * This is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */

var loaded = false;

const EstEidModName = "Estonian ID Card";
const nsModDB = "@mozilla.org/security/pkcs11moduledb;1";
const nsHttpProtocolHandler = "@mozilla.org/network/protocol;1?name=http";
const nsPKCS11 = "@mozilla.org/security/pkcs11;1";
const nsFile = "@mozilla.org/file/local;1";
const PKCS11_PUB_READABLE_CERT_FLAG  =  0x1<<28; //Stored certs can be read off the token w/o logging in

var Ci = Components.interfaces;
var Cc = Components.classes;

function log(message) { Application.console.log(message); }

function removeModule(module) {
  var pkcs11 = Cc[nsPKCS11].getService(Ci.nsIPKCS11);
  try {
    pkcs11.deleteModule(module);
  }
  catch(e) {
    log("Unable to remove module " + module + ":" + e);
  }
}

function loadModule(moduleDll) {
  var pkcs11 = Cc[nsPKCS11].getService(Ci.nsIPKCS11);
  try {
    pkcs11.addModule(EstEidModName, moduleDll, PKCS11_PUB_READABLE_CERT_FLAG, 0);
  }
  catch(e) {
    log("Unable to load module: " + e);
  }
}
function ModuleLoader() {
  var platform = detectOS();
  var bits = detectArchitecture();

  var moduleDll;
  if (platform == "Macintosh") {
    moduleDll = "/Library/EstonianIDCard/lib/esteid-pkcs11-onepin.so";
  } else if (platform == "X11") {
    [ "/usr/lib64/onepin-opensc-pkcs11.so",
      "/usr/lib64/opensc-pkcs11.so",
      "/usr/lib/x86_64-linux-gnu/onepin-opensc-pkcs11.so",
      "/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so",
      "/usr/lib/i386-linux-gnu/onepin-opensc-pkcs11.so",
      "/usr/lib/i386-linux-gnu/opensc-pkcs11.so",
      "/usr/lib/onepin-opensc-pkcs11.so",
      "/usr/lib/opensc-pkcs11.so"
    ].some(function(path) {
      log(path);
      var f = Cc[nsFile].createInstance(Ci.nsILocalFile);
      f.initWithPath(path);
      if (f.exists())
        moduleDll = path;
      return f.exists();
    });
  } else if (platform == "Windows") {
    moduleDll = "onepin-opensc-pkcs11.dll";
  }
  else {
    throw "Failed to detect Operating System."
  }

  var securityModuleDb = Cc[nsModDB].createInstance(Ci.nsIPKCS11ModuleDB);
  var modules = securityModuleDb.listModules();

  var needToLoad = true;
  for (; ;) {
    var module = modules.currentItem().QueryInterface(Ci.nsIPKCS11Module);
    /* Remove modules that have recognized names but different DLLs */
    if (module) {
      if (module.libName == moduleDll && module.name == EstEidModName) {
        needToLoad = false;
      } else if (module.name == EstEidModName) {
        removeModule(module.name)
      }
    }
    try {
      modules.next();
    }
    catch(e) {
      break;
    }
  }

  if (needToLoad) {
    loadModule(moduleDll);
  }
}

function detectOS() {
  var httpHandler = Cc[nsHttpProtocolHandler].getService(Ci.nsIHttpProtocolHandler);
  return httpHandler.platform;
}

function detectArchitecture() {
  var httpHandler = Cc[nsHttpProtocolHandler].getService(Ci.nsIHttpProtocolHandler);
  var osCPU = httpHandler.oscpu;
  return (osCPU.indexOf(" x86_64") < 0 && osCPU.indexOf(" x64") < 0) ? 32 : 64;
}

try {
  if (!loaded) {
    ModuleLoader();
  }
  loaded = true;
}
catch (e) {
  log(e)
}
