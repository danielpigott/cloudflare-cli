cloudflare-cli
==============

CLI for interacting with Cloudflare

## Installation
`npm install -g cloudflare-cli`

## Setup
You can setup a yaml config file with default parameters e.g. token and email.
By default cfcli will look for ".cfcli.yml" in your home directory (you can also pass in a config file with -c)

### Configuration Example
If you have only one cloudflare account you can set it up as below:

```yaml
defaults:
    token: <cloudflare-token>
    email: <you@domain.com>
    domain: <default-cloudflare-domain>
```

If you have multiple cloudflare accounts, and you can set up accounts as below:

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

You can then use `-u play` to interact with the second cloudflare account.

## Usage

```
NAME
    cfcli - Interact with cloudflare from the command line

SYNOPSIS
    cfcli [options] command [parameters]

OPTIONS:
    -c  --config    Path to yml file with config defaults (defaults to ~/.cfcli.yml
    -e  --email     Email of your cloudflare account
    -k  --token     Token for your cloudflare account
    -u  --account   Choose one of your named cloudflare accounts from .cfcli.yml
    -d  --domain    Domain to operate on
    -a  --activate  Activate cloudflare after creating record (for addrecord)
    -f  --format    Format when printing records (csv or table)
    -t  --type      Type of record (for dns record functions)
    -p  --priority  Set priority when adding a record (MX or SRV)
    -l  --ttl       Set ttl on add or edit (120 - 86400 seconds, or 1 for auto)
    -h  --help      Display help

COMMANDS:
    addrecord <name> <content>
        Add a DNS record. Use -a to activate cf after creation
    devmode on|off
        Toggle development mode on/off
    disablecf <name> [content]
        Disable cloudflare caching for given record and optionally specific value
    editrecord <name> <content>
        Edit a DNS record.
    enablecf <name> [content]
        Enable cloudflare caching for given record and optionally specific value
    listdomains
        List domains in your cloudflare account
    listrecords
        List dns records for the domain
    purgecache
        Clear all cache files for the domain
    purgefile <url>
        Purge file at given url
    removerecord <name> [content]
        Remove record with given name and optionally specific value
```

### Examples
Add a new A record (mail) and activate cloudflare (-a)
```
cfcli -a -t A addrecord mail 127.0.0.1
```

Edit a record (mail) and set the TTL
```
cfcli --ttl 120 editrecord  mail 127.0.0.1
```

Remove all records with the name test
```
cfcli removerecord test
```

Remove record with name test and value 1.1.1.1
```
cfcli removerecord test 1.1.1.1
```
Enable cloudflare for any records that match test
```
cfcli --ttl 120 enablecf test
```
Enable cloudflare for a record test with the value test.com
```
cfcli --ttl 120 enablecf test test.com
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
cfcli -d test.com devmode on
```
