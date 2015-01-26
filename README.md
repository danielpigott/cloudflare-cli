cloudflare-cli
==============

CLI for interacting with Cloudflare

##Installation
`npm install -g cloudflare-cli`

##Setup
You can setup a yaml config file with default parameters e.g. token and email.
By default cfcli will look for ".cfcli.yml" in your home directory (you can also pass in a config file with -c)

###Configuration Example
```yaml
defaults:
    token: <cloudflare-token>
    email: <you@domain.com>
    domain: <default-cloudflare-domain>
```

or you have two more cloudflare accounts, and you can set up by this.

```yaml
defaults:
    account: work
accounts:
    work:
        token: <cloudflare-token>
        email: <you@domain.com>
        domain: <default-cloudflare-domain>
    play:
        token: <cloudflare-token>
        email: <you@domain.com>
        domain: <default-cloudflare-domain>
```

then you can use `-u play` to interact with another cloudflare account.

##Usage
```
NAME
    cfcli - Interact with cloudflare from the command line

SYNOPSIS
    cfcli [options] command [parameters]

OPTIONS:
    -c  --config    Path to yml file with config defaults (defaults to ~/.cfcli.yml
    -k  --token     Token for your cloudflare account
    -e  --email     Email of your cloudflare account
    -u  --account   Choose one of your cloudflare accounts by a short name in config accounts.
    -d  --domain    Domain to operate on
    -a  --activate  Activate cloudflare after creating record (for addrecord)
    -f  --format    Format when printing records (csv or table)
    -t  --type      Type of record (for dns record functions)
    -l  --ttl       Set the ttl when adding or editing, between 120 and 86400 seconds, or 1 for automatic.
    -h  --help      Display help

COMMANDS:
    addrecord [name] [content]
        Add a DNS record. Use -a to activate cf after creation
    devmode [on|off]
        Toggle development mode on/off
    disablecf [name]
        Disable cloudflare caching for given record
    editrecord [name] [content]
        Edit a DNS record.
    enablecf [name]
        Enable cloudflare caching for given record
    listdomains
        List domains in your cloudflare account
    listrecords
        List dns records for the domain
    purgecache
        Clear all cache files for the domain
    purgefile [url]
        Purge file at given url
    removerecord [name]
        Remove record with given name
```

###Examples
Add a new A record (mail) and activate cloudflare (-a)
```
cfcli -a -t A addrecord mail 127.0.0.1
```

Edit a record (mail) and set the TTL
```
cfcli --ttl 120 editrecord  mail 127.0.0.1
```

Export domain records for test.com to csv
```
cfcli -d test.com -f csv listrecords > test.csv
```

Purge a single file from cache
```
cfcli purgefile http://test.com/script.js
```

Enable dev mode for test.com domain
```
-cfcli -d test.com devmode on
```

