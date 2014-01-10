/**
 * Created by TongChia on 14-1-4.
 *
 * Inspired by CouchDB jQuery Plugin
 * Aims a simple couchdb client for nodejs
 *
 * 受 CouchDB jQuery Plugin 启发而制作的模块
 * 旨在实现服务器端node环境下类似jquery.couch的couchDB客户端
 */

var http = require('http');
var couch = module.exports = {set:{hostname:'localhost',path:'/',port:'5984'}};

/**
 * 针对couchDb设计的http请求函数
 * @param options
 * @param callback
 * function(object)
 * 获取和创建成功都直接返回couch请求的结果
 * 已存在 object.exist 为 true
 * 未找到 object.notFound 为 true
 * (不同情境下"已存在"或"未找到"不一定是错误的结果)
 * 其他错误 object.failed 为 true
 */

var request = function(options,callback){
    var back='';
    if(options.data){
        var data=options.data;
    }
    delete options.data;
    var req = http.request(options, function (res) {
        /** @namespace res.setEncoding */
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            if (res.statusCode == 200 || res.statusCode == 201 || req.status == 202) {
                back += chunk
            }
            else if (res.statusCode == 404) {
                back = '{"notFound":true}'
            }
            else if (res.statusCode == 412) {
                back = '{"exist":true}'
            }
            else {
                back = '{"failed":true}';
                console.log('\x1B[90msomething wrong! status:\x1B[31m' + res.statusCode + '\x1B[33m\nmake sure path/name is legit\x1B[39m')
            }
        });
        res.on('end', function () {
            callback(JSON.parse(back))
        })
    });
    req.on('error', function(e) {
        callback({"failed":true});
        console.log('\x1B[90mproblem with request: '+e.message+'\x1B[33m\nmake sure couchDb service exits\x1B[39m')
    });
    if(data){
        req.write(data)
    }
    req.end()
};

var opt=function(set,path,method,data){
    var back={
        hostname:set.hostname,
        port:set.port,
        path:set.path+path,
        method:method||'GET'
    };
    if(method=='POST'){
        back.headers = {
            'Content-Type': 'application/json'
        }
    }
    if(data){
        if(typeof data=='object'){
            data=JSON.stringify(data)
        }
        back.data=data;
    }
    return back
};

/**
 * show all database. 显示所有数据库.
 */

couch.allDbs=function(callback){
    request(opt(this.set,'_all_dbs'),callback)
};

/**
 * Fetch a new UUID.
 */

couch.newUUID=function(callback){
    request(opt(this.set,'_uuids'),callback)
};

/**
 * return all database method
 * @param {String} dbname
 * @returns {{info: info, create: create, remove: remove, allDocs: allDocs, allDesignDocs: allDesignDocs, createDoc: createDoc, getDoc: getDoc, removeDoc: removeDoc, query: query, view: view, doc: doc}}
 */

couch.db=function(dbname){
    var set=this.set;
    return {

        /** @namespace existDoc._rev */

        /**
         * database information
         */

        info:function(callback){
            request(opt(set,dbname),callback)
        },

        /**
         * create database. 创建数据库
         */

        create:function(callback){
            request(opt(set,dbname,'PUT'),callback)
        },

        /**
         * delete database. 删除数据库.
         */

        remove:function(callback){
            request(opt(set,dbname,'DELETE'),callback)
        },

        /**
         * show all doc. 显示所有文档.
         */

        allDocs:function(callback){
            request(opt(set,dbname+'/_all_docs'),callback)
        },

        /**
         * get all design docs. 显示所有设计文档
         */

        allDesignDocs:function(callback){
            request(opt(set,dbname+'/_design_docs'),callback)
        },

        /**
         * create doc without ID. 创建文档并使用couchDb自动生成的UUID
         * @param doc
         * @param callback
         */

        createDoc:function(doc,callback){
            request(opt(set,dbname,'POST',doc),callback)
        },

        /**
         * get doc by docId. 根据ID获取文档
         * @param docId
         * @param callback
         */

        getDoc:function(docId,callback){
            request(opt(set,dbname+'/'+docId),callback)
        },

        /**
         * remove Doc. 删除文档.
         * @param docId
         * @param callback
         */

        removeDoc:function(docId,callback){
            this.getDoc(docId,function(existDoc){
                if(existDoc._rev){
                    request(opt(set,dbname+'/'+docId+'?rev='+existDoc._rev,'DELETE'),callback)
                }
                else{
                    callback({notFound:true})
                }
            })
        },

        /**
         * temporary view. (javascript language) 临时视图.
         * @param mapFun
         * @param reduceFun
         * @param callback
         */

        query:function(mapFun,reduceFun,callback){
            var data={
                language:"javascript",
                map: mapFun
            };
            if(reduceFun!=null){data.reduce=reduceFun}
            request(opt(set,dbname+"/_temp_view",'POST',data),callback)
        },

        /**
         * get view's result. 返回视图结果.
         * @param viewName 'design/view' '设计文档名/视图名'
         * @param keys [string/number/array(2)/object]
         * @param callback
         */

        view:function(viewName,keys,callback){
            var queryStr='?';
            if(keys){
                if(keys instanceof Array){
                    queryStr+='startkey="'+keys[0]+'"&endkey="'+keys[1]+'"'
                }
                else if(typeof keys=='object'){
                    for(var i in keys)queryStr+=i+'="'+keys[i]+'"&'
                }
                else {
                    queryStr+='key="'+keys+'"'
                }
            }
            var name = viewName.split('/');
            request(opt(set,dbname+"/_design/"+name[0]+"/_view/"+name[1]+queryStr),callback)
        },

        /**
         * return doc method.
         * @param docId
         * @returns {{set: *, get: get, save: save, remove: remove}}
         */

        doc:function(docId){
            return{

                /**
                 * get doc by docId. 根据ID获取文档
                 * @param callback callback(result)
                 */

                get:function(callback){
                    request(opt(set,dbname+'/'+docId),callback)
                },

                /**
                 * save doc by docId. 保持文档 有则更新 无则创建.
                 * @param {Object} doc
                 * @param callback
                 */

                save:function(doc,callback){
                    var data={};
                    this.get(function(existDoc){
                        if(existDoc._rev){
                            for(var i in doc){
                                existDoc[i]=doc[i]
                            }
                            data=existDoc
                        }
                        else{
                            data=doc
                        }
                        request(opt(set,dbname+'/'+docId,'PUT',data),callback)
                    })
                },

                /**
                 * remove Doc. 删除文档.
                 * @param callback
                 */

                remove:function(callback){
                    this.get(function(existDoc){
                        if(existDoc._rev){
                            request(opt(set,dbname+'/'+docId+'?rev='+existDoc._rev,'DELETE'),callback)
                        }
                        else{
                            callback({"notFound":true})
                        }
                    })
                }
            };
        }
    };
};