/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    routesIndex = require('./routes/index1'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    fs = require('fs');

var app = express();

var db;

var cloudant;

var fileToUpload;

var dbCredentials = {
    dbName: 'my_sample_db'
};

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

function initDBConnection() {
    //When running on Bluemix, this variable will be set to a json object
    //containing all the service credentials of all the bound services
    if (process.env.VCAP_SERVICES) {
        var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
        // Pattern match to find the first instance of a Cloudant service in
        // VCAP_SERVICES. If you know your service key, you can access the
        // service credentials directly by using the vcapServices object.
        for (var vcapService in vcapServices) {
            if (vcapService.match(/cloudant/i)) {
                dbCredentials.url = vcapServices[vcapService][0].credentials.url;
            }
        }
    } else { //When running locally, the VCAP_SERVICES will not be set

        // When running this app locally you can get your Cloudant credentials
        // from Bluemix (VCAP_SERVICES in "cf env" output or the Environment
        // Variables section for an app in the Bluemix console dashboard).
        // Alternately you could point to a local database here instead of a
        // Bluemix service.
        // url will be in this format: https://username:password@xxxxxxxxx-bluemix.cloudant.com
        dbCredentials.url = "REPLACE ME";
    }

    cloudant = require('cloudant')(dbCredentials.url);

    // check if DB exists if not create
    cloudant.db.create(dbCredentials.dbName, function(err, res) {
        if (err) {
            console.log('Could not create new db: ' + dbCredentials.dbName + ', it might already exist.');
        }
    });

    db = cloudant.use(dbCredentials.dbName);
}

initDBConnection();
var responseData = {
   "Name":"XXX",
   "Designation":"XXX",
   "Joining Date":"XXX",
   "Enterprize ID":"XXX",
   "Employee Number":"XXX",
   "Project":{
      "Project Name":"XXX",
      "Project Decription":"XXX",
      "Project Location":"XXX",
      "Project DU Name":"XXX",
      "Project DU Lead Name":"XXX",
      "Project POC":"XXX",
      "Project Contact Number":"XXX",

   },
   "TaskList":[
      {
         "task":"XXX",
         "status":"pending"
      },
      {
         "task":"XXX",
         "status":"pending"
      },
      {
         "task":"XXX",
         "status":"completed"
      }
   ],
   "Trainings":{
      "Mandatory":[
         "Trianing1URL",
         "Training2URL",
         "Training3URL"
      ],
      "Project Specific Trainings":[
         "Trianing1URL",
         "Training2URL",
         "Training3URL"
      ]
   }
}
var locationData = {
   "Library":{
      "Location Detail":"XXX",
      "Location360ImageUrl":"XXX"
   },
   "Cafeteria":{
      "Location Detail":"XXX",
      "Location360ImageUrl":"XXX"
   },
   "ProjectBay":{
      "Location Detail":"XXX",
      "Location360ImageUrl":"XXX"
   }
}
function getEmpDataSAP(sapID){
	if(!sapID) return {"Error":"No Record Found(s)"}
	var empSAPDate = [{"Image":"image1", "Name":"Pranav","Designation":"Lead","JoiningDate":"July, 30, 2016","EnterprizeID":"pranav.buradkar@accenture.com","EmployeeNumber":"11279507","Project":{"ProjectName":"Coke SFA","ProjectDescription":"Ria is cool","ProjectLocation":"Pune PDC5","ProjectDUName":"VE","ProjectDULeadName":"Dhanashree","ProjectPOC":"Vinod","ProjectContactNumber":"12345678","ProjectIcon":"prjIcon1",},"TaskList":[{"task":"Pranav Task 1","status":"false"},{"task":"Pranav Task 2","status":"false"},{"task":"Pranav Task 3","status":"true"}],"Trainings":[{"Name":" Virtual Experiece Learning Board","URL":"https://connectedlearning.accenture.com/learningboard/170218-augmented-virtual-and-mixed-reality"},{"Name":"Augmented Reality Basics","URL":"https://connectedlearning.accenture.com/learningboard/170218-augmented-virtual-and-mixed-reality"}]}];
	for(i in empSAPDate){
		if(empSAPDate[i].EmployeeNumber==sapID){
			return empSAPDate[i];
		}
	}
	return {"Error":"No Record Found(s)"}
}

app.get('/', routes.index);
app.get('/index', routesIndex.index1);
app.get('/getempdata', function(req, res) {
  res.json(responseData);
});
app.get('/getlocationdata', function(req, res) {
  res.json(locationData);
});
app.get('/getempsapdata/:sapID', function(req, res) {
  res.json(getEmpDataSAP(req.params.sapID));
});
app.post('/insertempdata', function(request, response) {
    var data = request.body.data;
    var id = Date.now();
    db.insert({"data":"data","check":data}, id, function(err, doc) {
        if (err) {
            console.log(err);
            response.sendStatus(500);
        } else
            response.sendStatus(200);
        response.end();
    });
   

});
function createResponseData(id, name, value, attachments) {

    var responseData = {
        id: id,
        name: name,
        value: value,
        attachements: []
    };


    attachments.forEach(function(item, index) {
        var attachmentData = {
            content_type: item.type,
            key: item.key,
            url: '/api/favorites/attach?id=' + id + '&key=' + item.key
        };
        responseData.attachements.push(attachmentData);

    });
    return responseData;
}


var saveDocument = function(id, name, value, response) {

    if (id === undefined) {
        // Generated random id
        id = '';
    }

    db.insert({
        name: name,
        value: value
    }, id, function(err, doc) {
        if (err) {
            console.log(err);
            response.sendStatus(500);
        } else
            response.sendStatus(200);
        response.end();
    });

}

app.get('/api/favorites/attach', function(request, response) {
    var doc = request.query.id;
    var key = request.query.key;

    db.attachment.get(doc, key, function(err, body) {
        if (err) {
            response.status(500);
            response.setHeader('Content-Type', 'text/plain');
            response.write('Error: ' + err);
            response.end();
            return;
        }

        response.status(200);
        response.setHeader("Content-Disposition", 'inline; filename="' + key + '"');
        response.write(body);
        response.end();
        return;
    });
});

app.post('/api/favorites/attach', multipartMiddleware, function(request, response) {

    console.log("Upload File Invoked..");
    console.log('Request: ' + JSON.stringify(request.headers));

    var id;

    db.get(request.query.id, function(err, existingdoc) {

        var isExistingDoc = false;
        if (!existingdoc) {
            id = '-1';
        } else {
            id = existingdoc.id;
            isExistingDoc = true;
        }

        var name = request.query.name;
        var value = request.query.value;

        var file = request.files.file;
        var newPath = './public/uploads/' + file.name;

        var insertAttachment = function(file, id, rev, name, value, response) {

            fs.readFile(file.path, function(err, data) {
                if (!err) {

                    if (file) {

                        db.attachment.insert(id, file.name, data, file.type, {
                            rev: rev
                        }, function(err, document) {
                            if (!err) {
                                console.log('Attachment saved successfully.. ');

                                db.get(document.id, function(err, doc) {
                                    console.log('Attachements from server --> ' + JSON.stringify(doc._attachments));

                                    var attachements = [];
                                    var attachData;
                                    for (var attachment in doc._attachments) {
                                        if (attachment == value) {
                                            attachData = {
                                                "key": attachment,
                                                "type": file.type
                                            };
                                        } else {
                                            attachData = {
                                                "key": attachment,
                                                "type": doc._attachments[attachment]['content_type']
                                            };
                                        }
                                        attachements.push(attachData);
                                    }
                                    var responseData = createResponseData(
                                        id,
                                        name,
                                        value,
                                        attachements);
                                    console.log('Response after attachment: \n' + JSON.stringify(responseData));
                                    response.write(JSON.stringify(responseData));
                                    response.end();
                                    return;
                                });
                            } else {
                                console.log(err);
                            }
                        });
                    }
                }
            });
        }

        if (!isExistingDoc) {
            existingdoc = {
                name: name,
                value: value,
                create_date: new Date()
            };

            // save doc
            db.insert({
                name: name,
                value: value
            }, '', function(err, doc) {
                if (err) {
                    console.log(err);
                } else {

                    existingdoc = doc;
                    console.log("New doc created ..");
                    console.log(existingdoc);
                    insertAttachment(file, existingdoc.id, existingdoc.rev, name, value, response);

                }
            });

        } else {
            console.log('Adding attachment to existing doc.');
            console.log(existingdoc);
            insertAttachment(file, existingdoc._id, existingdoc._rev, name, value, response);
        }

    });

});

app.post('/api/favorites', function(request, response) {

    console.log("Create Invoked..");
    console.log("Name: " + request.body.name);
    console.log("Value: " + request.body.value);

    // var id = request.body.id;
    var name = request.body.name;
    var value = request.body.value;

    saveDocument(null, name, value, response);

});

app.delete('/api/favorites', function(request, response) {

    console.log("Delete Invoked..");
    var id = request.query.id;
    // var rev = request.query.rev; // Rev can be fetched from request. if
    // needed, send the rev from client
    console.log("Removing document of ID: " + id);
    console.log('Request Query: ' + JSON.stringify(request.query));

    db.get(id, {
        revs_info: true
    }, function(err, doc) {
        if (!err) {
            db.destroy(doc._id, doc._rev, function(err, res) {
                // Handle response
                if (err) {
                    console.log(err);
                    response.sendStatus(500);
                } else {
                    response.sendStatus(200);
                }
            });
        }
    });

});

app.put('/api/favorites', function(request, response) {

    console.log("Update Invoked..");

    var id = request.body.id;
    var name = request.body.name;
    var value = request.body.value;

    console.log("ID: " + id);

    db.get(id, {
        revs_info: true
    }, function(err, doc) {
        if (!err) {
            console.log(doc);
            doc.name = name;
            doc.value = value;
            db.insert(doc, doc.id, function(err, doc) {
                if (err) {
                    console.log('Error inserting data\n' + err);
                    return 500;
                }
                return 200;
            });
        }
    });
});

app.get('/api/favorites', function(request, response) {

    console.log("Get method invoked.. ")

    db = cloudant.use(dbCredentials.dbName);
    var docList = [];
    var i = 0;
    db.list(function(err, body) {
        if (!err) {
            var len = body.rows.length;
            console.log('total # of docs -> ' + len);
            if (len == 0) {
                // push sample data
                // save doc
                var docName = 'sample_doc';
                var docDesc = 'A sample Document';
                db.insert({
                    name: docName,
                    value: 'A sample Document'
                }, '', function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else {

                        console.log('Document : ' + JSON.stringify(doc));
                        var responseData = createResponseData(
                            doc.id,
                            docName,
                            docDesc, []);
                        docList.push(responseData);
                        response.write(JSON.stringify(docList));
                        console.log(JSON.stringify(docList));
                        console.log('ending response...');
                        response.end();
                    }
                });
            } else {

                body.rows.forEach(function(document) {

                    db.get(document.id, {
                        revs_info: true
                    }, function(err, doc) {
                        if (!err) {
                            if (doc['_attachments']) {

                                var attachments = [];
                                for (var attribute in doc['_attachments']) {

                                    if (doc['_attachments'][attribute] && doc['_attachments'][attribute]['content_type']) {
                                        attachments.push({
                                            "key": attribute,
                                            "type": doc['_attachments'][attribute]['content_type']
                                        });
                                    }
                                    console.log(attribute + ": " + JSON.stringify(doc['_attachments'][attribute]));
                                }
                                var responseData = createResponseData(
                                    doc._id,
                                    doc.name,
                                    doc.value,
                                    attachments);

                            } else {
                                var responseData = createResponseData(
                                    doc._id,
                                    doc.name,
                                    doc.value, []);
                            }

                            docList.push(responseData);
                            i++;
                            if (i >= len) {
                                response.write(JSON.stringify(docList));
                                console.log('ending response...');
                                response.end();
                            }
                        } else {
                            console.log(err);
                        }
                    });

                });
            }

        } else {
            console.log(err);
        }
    });

});


http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port ' + app.get('port'));
});
