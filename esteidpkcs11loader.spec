Name: esteidpkcs11loader		
Version: 3.9
Release: 1%{?dist}
Summary: EstEID Firefox PKCS#11 loader
Group: Applications/Internet		
License: LGPLv2+
URL: http://www.ria.ee		
Source0: esteidpkcs11loader.tar.gz	
BuildRoot: %{_tmppath}/-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArchitectures: noarch

BuildRequires: cmake, make
Requires: opensc, pcsc-lite

%description
Loads PKCS#11 module for web authentication with smart cards

%prep
%setup -q -n %{name}
cmake -DCMAKE_BUILD_TYPE=RelWithDebInfo  -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_VERBOSE_MAKEFILE=ON

%build
make

%install
rm -rf %{buildroot}
make install DESTDIR=%{buildroot}

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%doc
%{_datadir}/mozilla/extensions/*

%changelog
* Fri Aug 13 2010 RIA <info@ria.ee> 1.0-1
- first build no changes
