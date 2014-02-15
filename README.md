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
`cfcli [options] command [parameters]`
