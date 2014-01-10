# couchQuery
===========

## Install

```bash
npm install couchquery
```

## require

```js
var couch = require('couchquery');
```

## setting

```js
couch.set.hostname='localhost'    //Default
couch.set.port='5984'             //Default
couch.set.path='/'                //Default
```

## save a document

couch.db('db_name').saveDoc(doc,callback)
or
couch.db('db_name').doc('doc_id').save(doc,callback)

For example
```js
var doc={"title":"foo","author":"TongChia","content":"bar..","date":new Date()}
couch.db('articles').doc('CustomID').save(doc,function(obj){console.log(obj)})
```
Or use UUID created by default
```js
couch.db('articles').saveDoc(doc,function(obj){console.log(obj)})
```

## get a document

couch.db('db_name').doc('doc_id').get(callback)    // return a object

For example working whit express
```js
couch.db('articles').doc('uuid').get(function(object){res.render('blog', object)})
```

## temporary view

couch.db('db_name').query(mapFun,reduceFun,callback)

For example
```js
couch.db('articles').query('function(doc){emit(doc.date,doc.title)}',null,function(obj){res.send(obj)})
```

## view

couch.db('db_name').view(viewName,keys,callback)

{String} viewName : 'design/view'
{String/Array(2)/Object} keys : 'foo' / ['foo','bar'] / {"startkey":"2012/12/23","endkey":"2014/01/02","descending":true}

For example
```js
couch.db('articles').view('list/date',['foo','bar'],function(obj){console.log(obj)})
```

## Others

couch.allDbs(callback)
couch.newUUID(callback)
couch.db('db_name').info(callback)
couch.db('db_name').create(callback)
couch.db('db_name').remove(callback)
couch.db('db_name').allDocs(callback)
couch.db('db_name').createDoc(doc,callback)
couch.db('db_name').getDoc(docId,callback)
couch.db('db_name').doc('doc_id').remove(callback)


## PS

All callback return an object

If it can not found database or doc return {"notFound":true} 
If create database but exists return {"exist":true} you can choose delete or use it
Other failed return {"failed":true}

Sorry my english

Welcome suggestions








