/*
 * Firefox PKCS11 loader
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

(async function () {
  if(typeof browser.pkcs11 === 'undefined')
    return;
  async function load(modname) {
    try {
      var isInstalled = await browser.pkcs11.isModuleInstalled(modname);
      if(isInstalled) {
        console.log("module installed: " + modname);
        return;
      }
      const PKCS11_PUB_READABLE_CERT_FLAG = 0x1<<28;
      await browser.pkcs11.installModule(modname, PKCS11_PUB_READABLE_CERT_FLAG);
      console.log("Loaded module " + modname);
    } catch(e) {
      console.error("Unable to load module: ", e);
    }
  }
  async function unload(modname) {
    try {
      var isInstalled = await browser.pkcs11.isModuleInstalled(modname);
      if(!isInstalled) {
        console.log("module is not installed: " + modname);
        return;
      }
      await browser.pkcs11.uninstallModule(modname);
      console.log("Unloaded module " + modname);
    } catch(e) {
      console.error("Unable to unload module: ", e);
    }
  }
  load("onepinopenscpkcs11");
  unload("idemiaawppkcs11");
})();
