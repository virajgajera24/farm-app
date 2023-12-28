var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
const { render } = require('ejs');
const storage = require('node-persist');

var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs');

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'farm'
})
con.connect();

app.get('/', function (req, res) {
    res.render('user/user_login');
});
app.post('/', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var query = `select * from user where email='${email}' and password='${password}'`
    con.query(query,async function (error,result,index){
        if (error)throw error;
        if(result.length != 0){
            await storage.init( /* options ... */ );
            await storage.setItem('userid',result[0].id)
            await storage.setItem('username',result[0].name)
            res.redirect('/home')
        }
        else{
            res.redirect('/')
        }
    })
});
app.get('/register', function(req, res) {
    res.render('register');
});
app.post('/register', function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var role = req.body.role;

    if (role == 'user'){
        var query = `insert into user (name,email,password)values('${name}','${email}','${password}')`
    con.query(query, function(error,result,index){
        if (error)throw error;
        res.redirect('/');
    })
    }
    else{
        var query = `insert into seller (name,email,password)values('${name}','${email}','${password}')`
    con.query(query, function(error,result,index){
        if (error)throw error;
        res.redirect('/seller_login');
    })
    }
})
app.get('/seller_login', function (req, res) {
    res.render('seller/seller_login');
});
app.post('/seller_login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var query = `select * from seller where email='${email}' and password='${password}'`
    con.query(query,async function (error,result,index){
        if (error)throw error;
        if(result.length != 0){
            await storage.init( /* options ... */ );
            await storage.setItem('sellerid',result[0].id)
            await storage.setItem('sellername',result[0].name)
            res.redirect('/seller/dashboard')
        }
        else{
            res.redirect('/seller_login')
        }
    })
});
app.get('/home', async function (req, res) {

    await storage.init( /* options ... */ );
    var username = await storage.getItem('username');
    var userid = await storage.getItem('userid');
    var query = "select * from product "
    con.query(query, function (error,result,index){
        if (error)throw error;
        res.render('user/home',{username:username,userid:userid,result});
    });
})
app.get('/seller/dashboard',async function (req, res) {
   
    await storage.init( /* options ... */ );
    var sellername = await storage.getItem('sellername');
    var sellerid = await storage.getItem('sellerid');
    var query = `select * from product where seller_id=${sellerid}`
       con.query(query, function (error,result,index){
        if (error)throw error;
        res.render('seller/dashboard',{sellername:sellername,result})
       });
})
app.get('/seller/add_product', function (req, res) {
    res.render('seller/add_product');
})
app.post('/seller/add_product',async function (req, res) {

    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    await storage.init( /* options ... */ );
    var sellerid = await storage.getItem('sellerid')
    var query = `insert into product (name, price, image,seller_id) values('${name}', ${price},'${image}',${sellerid})`
    con.query(query, function (error,result,index){
        if (error)throw error;
        res.redirect('/seller/add_product');
    });
})
app.get('/seller/delete/:id', function (req, res) {
    var id = req.params.id;
    var query = `delete from product where id = ${id}`;
    con.query(query, function (error,result,index){
        if (error) throw error;
        var query = `delete from buylist where product_id = ${id}`;
        con.query(query, function (error,result,index){
            if (error) throw error;
        res.redirect('/seller/dashboard');
    });
    });
})
app.get('/seller/product_edit/:id', function (req, res){
    var id = req.params.id
    var query = `select * from product where id=${id}`;
    con.query(query, function (error,result,index){
        if (error)throw error;
        res.render('seller/product_edit', {result});
    });
})
app.post('/seller/product_edit/:id', function (req, res){
    var id = req.params.id
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var query = `update product set name='${name}',image='${image}',price=${price} where id=${id}`;
    con.query(query, function (error,result,index){
        if(error)throw error;
        res.redirect('/seller/dashboard')
    });
});
app.get('/seller/manage_order',async function (req,res){
    await storage.init( /* options ... */ );
    var sellerid = await storage.getItem('sellerid')
    var query = `select product.* , orders.* from orders inner join product on orders.product_id = product.id where product.seller_id= ${sellerid}`
    con.query(query, function (error,result,index){
        if (error)throw error;
        console.log(result);
        res.render('seller/manage_order',{result})
    })
})
app.get('/seller/manage_order/:status/:id', function (req,res){
    var id = req.params.id;
    var status = req.params.status;
    var query = `update orders set status='${status}' where id=${id}`
    con.query(query,function (error,result,index){
        if (error)throw error;
        res.redirect('/seller/manage_order');
    });
});

app.get('/buy/:id',async function (req, res) {
    var productid = req.params.id;
    await storage.init( /* options ... */ );
    var userid = await storage.getItem('userid');
    var query = `insert into buylist (user_id,product_id) values(${userid},${productid})`
    con.query(query, function(error,result,index){
        if(error)throw error;
        res.redirect('/home')
    })
});
app.get('/user_buylist',async function(req, res){
    await storage.init( /* options ... */ );
    var userid = await storage.getItem('userid');
    var query = `select buylist.* , product.* from product inner join buylist on buylist.product_id = product.id where buylist.user_id = ${userid}`
   // 
    con.query(query, function(error,result,index){
        if (error) throw error;
        res.render('user/user_buylist',{result});
    })
})

app.get('/user_buylist/delete/:id', function (req, res) {
    var id = req.params.id;
        var query = `delete from buylist where product_id = ${id}`;
        con.query(query, function (error,result,index){
            if (error) throw error;
        res.redirect('/user_buylist');
    });
   
})
app.get('/user_order',async function (req, res) {
    await storage.init( /* options ... */ );
    var userid = await storage.getItem('userid');
    var query = `SELECT * FROM buylist WHERE user_id = '${userid}'`
    con.query(query, function (error, result,index){
        if(error) throw error;
        for(var i = 0; i < result.length; i++){
            console.log(result.length);
            var insert = `insert into orders(user_id, product_id) values ('${result[i].user_id}', '${result[i].product_id}')`
            con.query(insert, function (error, result,index){
                if(error) throw error;
                console.log("added");
            });
           }
        console.log(result);
    })
})
app.get('/orderlist',async function(req, res){
    await storage.init( /* options ... */ );
    var userid = await storage.getItem('userid');
    var query = `select orders.* , product.* from product inner join orders on orders.product_id = product.id where orders.user_id = ${userid}`
   // 
    con.query(query, function(error,result,index){
        if (error) throw error;
        res.render('user/orderlist',{result});
    })
})
app.listen(3000);