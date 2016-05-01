/*
 * Estonian ID card plugin for web browsers
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
 
(function () {
  const EstEidModName = "Estonian ID Card";
  var Ci = Components.interfaces;
  var Cc = Components.classes;
  var pkcs11db = Cc["@mozilla.org/security/pkcs11moduledb;1"].createInstance(Ci.nsIPKCS11ModuleDB);
  var pkcs11 = Cc["@mozilla.org/security/pkcs11;1"].getService(Ci.nsIPKCS11);
  var httpHandler = Cc["@mozilla.org/network/protocol;1?name=http"].getService(Ci.nsIHttpProtocolHandler);
  var log = function(message) { console.log(message); }

  log("Loading extension " + EstEidModName);

  var moduleDll = "";
  switch (httpHandler.platform) {
  case "Windows":
    moduleDll = "onepin-opensc-pkcs11.dll";
    break
  case "Macintosh":
    moduleDll = "/Library/EstonianIDCard/lib/esteid-pkcs11-onepin.so";
    break;
  default:
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
      var f = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      f.initWithPath(path);
      if (f.exists())
        moduleDll = path;
      return f.exists();
    });
  }

  try {
    var module = pkcs11db.findModuleByName(EstEidModName);
    if (module.libName == moduleDll) {
      log("Module already initialized " + module.name + " (" + module.libName + ")");
      return;
    }
    try {
      log("Removing module " + module.name + " (" + module.libName + ")");
      pkcs11.deleteModule(module.name);
    }
    catch(e) {
      log("Unable to remove module:" + e);
    }
  }
  catch(e) {
  }

  try {
    log("Loading module " + EstEidModName + " (" + moduleDll + ")");
    //Stored certs can be read off the token w/o logging in
    const PKCS11_PUB_READABLE_CERT_FLAG = 0x1<<28;
    pkcs11.addModule(EstEidModName, moduleDll, PKCS11_PUB_READABLE_CERT_FLAG, 0);
  }
  catch(e) {
    log("Unable to load module: " + e);
  }
})();
