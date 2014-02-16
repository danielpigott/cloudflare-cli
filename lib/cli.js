'use strict';
var assert = require('assert');
var _ = require('lodash');
var argv = require('./argv');
var fs   = require('fs');

function CloudflareCli() {
    argv = argv.run();
    if (argv == false || argv._.length == 0) {
        this.showHelp();
    } else {
        this.init(argv.token,argv.email);
        var command = argv._[0];
        this.runCommand(command, argv);
    }
};
var cfcli = CloudflareCli.prototype;

/**
 * Set up cloudflare client
 **/
cfcli.init = function(token, email) {
  cfcli.cloudflare = require('cloudflare').createClient({
        email: email,
        token: token 
    });
};

cfcli.runCommand = function(command, options) {
    if(cfcli[command]) {
        cfcli[command](options);
    } else {
        console.log('Command not found: ' + command);
        this.showHelp();
    }
}

/*
 * Show contents of help file
 */
cfcli.showHelp = function() {
    console.log(fs.readFileSync(__dirname + '/../doc/help.txt', 'utf8'));
}

/*
 * Append domain to given record if required
 */
cfcli.prepareName = function (name, domain) {
    if(name.indexOf(domain) == -1) {
        name = name + '.' + domain;
    }
    return name;
};

cfcli.findRecord = function(name, result) {
    var match = _.find(
        result,
         function(row){
            return row.name == name;
        }
    );
    if (match == undefined) {
        console.log("Unable to find record " + name);
        match = false;
    }
    return match;
}


cfcli.addrecord = function(options) {
    cfcli.cloudflare.addDomainRecord(
        options.domain,
        {
            type: options.type,
            name: options._[1],
            content: options._[2] 
        },
        function(err, res) {
            if (err != null) {
                console.log(err);
            } else {
                console.log("finished");
            }
        }
    )
};

/**
 * Remove given record from the current domain
 **/
cfcli.removerecord = function(options) {
    var removeRecord = function(err, result) {
        var name = cfcli.prepareName(options._[1],options.domain);
        var match = cfcli.findRecord(name, result); 
        if (match != false) {
            console.log("Deleting " + match.name);
            cfcli.cloudflare.deleteDomainRecord(
                options.domain,
                match.rec_id,
                function(err, result) {
                    console.log("Finished");
                }
            );
        }
                    
    }
    cfcli.cloudflare.listDomainRecords(options.domain, removeRecord);
};

var setActive = function(record, domain, active) {
    record.service_mode = active;
    delete record.prio;
    cfcli.cloudflare.editDomainRecord(
        domain,
        record.rec_id,
        record,
        function(err, res) {
            if (err != null) {
                console.log(err);
            } else {
                console.log("finished");
            }
        }
    );
}

cfcli.enablecf = function(options) {
    var editRecord = function(err, result) {
        var name = cfcli.prepareName(options._[1], options.domain);
        var match = cfcli.findRecord(name, result); 
        if (match != false) {
            console.log("Activating cloudflare for " + match.name);
            setActive(match,options.domain, 1);
        }
                    
    }
    cfcli.cloudflare.listDomainRecords(options.domain, editRecord);
};

cfcli.disablecf = function(options) {
    var editRecord = function(err, result) {
        var name = cfcli.prepareName(options._[1], options.domain);
        var match = cfcli.findRecord(name, result); 
        if (match != false) {
            console.log("Deactivating cloudflare for " + match.name);
            setActive(match,options.domain, 0);
        }
    }
    cfcli.cloudflare.listDomainRecords(options.domain, editRecord);
};

cfcli.purgecache = function(options) {
    cfcli.cloudflare.clearCache(options.domain, function(err, result) {
        if(err) {
            console.log(err);
        } else {
            console.log('Cache purged for domain ' + options.domain);
        }
    });
}

cfcli.purgefile = function(options) {
    var url  = options._[1];
    cfcli.cloudflare.zoneFilePurge(options.domain, url, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log('Purged file ' + url);
        }
    });
}


module.exports = {
    CloudflareCli : CloudflareCli,
    createCli : function() {
        return new CloudflareCli();
    }
}
