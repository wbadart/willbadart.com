---
date: 2020-04-10T09:12
---

# LDAP

The _Lightweight Directory Access Protocol_ (LDAP) is an open,
general-purpose protocol for manipulating data stores, commonly used
for storing user data and performing authentication.

LDAP stores _entries_ in a hierarchical _Directory Information Tree_
(DIT), each being uniquely identified by a _distinguished name_ (DN)
-- a sequence of zero or more _relative distinguished names_ (RDNs)
which form a path from the entry to the root of the DIT. An entry is
a collection of _attributes_ about an entity, and is defined by one
or more schemas (_object classes_).

Since it is an open protocol, there are many _directory servers_
which implement it; a list of popular options is given at
[ldap.com][01], which includes [OpenLDAP][02].

There are three common operations on the DIT:
1. `ldapsearch`: query for an entry
2. `ldapadd`: add an entry
3. `ldapmodify`: add, modify, or delete attributes of an entry

Use a _bind DN_ (`-D`) to identify yourself to the directory server,
e.g.:

```shell
$ ldapsearch -D "cn=admin,dc=example,dc=org" -w <mypassword>
```

[01]: https://ldap.com/directory-servers
[02]: https://www.openldap.org
