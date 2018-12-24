cloudflare-cli
==============
[![npm version](https://badge.fury.io/js/cloudflare-cli.svg)](https://badge.fury.io/js/cloudflare-cli)
[![CircleCI](https://circleci.com/gh/danielpigott/cloudflare-cli.svg?style=svg)](https://circleci.com/gh/danielpigott/cloudflare-cli)

CLI for interacting with Cloudflare

## Installation
`npm install -g cloudflare-cli`

You can also use cloudflare-cli using Docker so you won't have to install npm
dependencies on your host.
```bash
docker build -t cloudflare-cli .
docker run --rm -it cloudflare-cli -h
```

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

### Environment Variables
If you have the below environment variables set, they will be used in preference to your config file:
```
CF_API_KEY # maps to token
CF_API_EMAIL # maps to email
CF_API_DOMAIN # maps to domain
```

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
    -f  --format    Format when printing records (csv,json or table)
    -t  --type      Type of record (for dns record functions)
    -p  --priority  Set priority when adding a record (MX or SRV)
    -q  --query     Comma separated filters to use when finding a record
    -l  --ttl       Set ttl on add or edit (120 - 86400 seconds, or 1 for auto)
    -h  --help      Display help

COMMANDS:
    add <name> <content>
        Add a DNS record. Use -a to activate cf after creation
    devmode on|off
        Toggle development mode on/off
    disable <name> [content]
        Disable cloudflare caching for given record and optionally specific value
    edit <name> <content>
        Edit a DNS record.
    enable <name> [content]
        Enable cloudflare caching for given record and optionally specific value
    find <name> [content]
        Find a record with given name and optionally specific value
    ls
        List dns records for the domain
    purge [urls]
        Purge file at given urls (space separated) or all files if no url given
    rm <name> [content]
        Remove record with given name and optionally specific value
    zone-add <name>
        Add a zone for given name
    zones
        List domains in your cloudflare account
```

### Examples
Add a new A record (mail) and activate cloudflare (-a)
```
cfcli -a -t A add mail 8.8.8.8
```

Edit a record (mail) and set the TTL
```
cfcli --ttl 120 edit  mail 8.8.8.8
```

Add an SRV record (then 3 numbers are priority, weight and port respectively)
```
cfcli -t SRV add _sip._tcp.example.com 1 1 1 example.com
```

Find all records matching the content value test.com
```
cfcli find -q content:test.com
```

Remove all records with the name test
```
cfcli rm test
```

Remove record with name test, type of A and value 1.1.1.1
```
cfcli rm test -q content:1.1.1.1,type:A
```

Enable cloudflare for any records that match test
```
cfcli enable test
```

Enable cloudflare for a record test with the value test.com
```
cfcli enable test test.com
```

Export domain records for test.com to csv
```
cfcli -d test.com -f csv listrecords > test.csv
```

Purge a given files from cache
```
cfcli -d test.com purge http://test.com/script.js http://test.com/styles.css
```

Enable dev mode for test.com domain
```
cfcli -d test.com devmode on
```

Add the zone test.com
```
cfcli zone-add test.com
```

### Testing
In order to run the tests you will need to set valid values for the
CF_API_EMAIL and CF_API_KEY environment variables.
This will add a zone (cloudflaretest.com), add and remove records against that domain and then remove
the zone.

The tests can be run with the following command
```
yarn test
```
