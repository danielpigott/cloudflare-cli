cloudflare-cli
==============

CLI for interacting with Cloudflare

##Installation
`npm install -g cloudflare-cli`

##Setup
You can setup a yaml config file with default parameters e.g. token and email.
By default cfcli will look for ".cfcli.yml" in your home directory (you can also pass in a config file with -c)

###Example 
```yaml
defaults:
    token: <cloudflare-token>
    email: <you@domain.com>
    domain: <default-cloudflare-domain>
```

##Usage
```
SYNOPSIS
    cfcli [options] command [parameters]

OPTIONS:
    -c  --config    Path to yml file with config defaults (defaults to ~/.cfcli.yml
    -k  --token     Token for your cloudflare account
    -e  --email     Email of your cloudflare account
    -d  --domain    Domain to operate on
    -a  --activate  Active cloudflare after creating record (for addrecord)
    -t  --type      Type of record (for dns record functions)
    -h  --help      Display help

COMMANDS:
    addrecord [name] [content]
        Add a DNS record. Use -a to activate cf after creation
    disablecf [name]
        Disable cloudflare caching for given record
    enablecf [name]
        Enable cloudflare caching for given record
    purgecache
        Clear all cache files for the domain
    purgefile [url]
        Purge file at given url
    removerecord [name]
        Remove record with given name
```
