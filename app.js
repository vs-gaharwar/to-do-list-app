require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(express.static(__dirname + '/public'));

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item(
  {
    name: "Welcome to your to do list!"
  }
);

const item2 = new Item(
  {
    name: "Hit the + button to add a new item."
  }
);

const item3 = new Item(
  {
    name: "<-- Hit this button to delete an item."
  }
);

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    itemsList: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res)
{
    const day = date.getDate();

    Item.find({}, function(err, result)
    {
        if(result.length === 0)
        {
            Item.insertMany(defaultItems, function(err)
            {
              if(err) console.log(err);
              else{
                console.log("Successfully inserted default items to DB!");
              }
            });

            res.redirect("/");
        }
        else{
            res.render('list', {listTitle: "Today", newListItem: result});
        }
    });
});

app.post("/", function(req, res)
{
    if(req.body.list === "Today")
    {
        let item = new Item({
          name: req.body.newItem
        })
        item.save();
        res.redirect("/");
    }
    else
    {
      let title = req.body.list;
      List.findOne({name: title}, function(err, foundList)
      {
            if(!err)
            {
                const item = new Item(
                  {
                      name: req.body.newItem
                  }
                );
                foundList.itemsList.push(item);
                foundList.save();
                res.redirect("/" + title);
            }
            else console.log(err);
      });
    }
});

app.post("/delete", function(req, res)
{
    let deleteItemId = req.body.checkbox;
    let listName = req.body.listName;

    if(listName === "Today")
    {
        Item.findByIdAndRemove(deleteItemId, function(err)
        {
            if(err) console.log(err);
            else console.log("Deleted checked item successfully");
        });
        res.redirect("/");
    }
    else
    {
        List.findOneAndUpdate({name: listName}, {$pull: {itemsList: {_id: deleteItemId}}}, function(err, foundList)
        {
            if(!err)  res.redirect("/" + listName);
            else console.log(err);
        });
    }
});

app.get("/:customListName", function(req, res)
{
    let customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList)
    {
          if(!err)
          {
              if(!foundList)
              {
                  let list = new List(
                    {
                        name: customListName,
                        itemsList: defaultItems
                    }
                  );
                  list.save();
                  res.render('list', {listTitle: customListName, newListItem: list.itemsList});
              }
              else res.render('list', {listTitle: customListName, newListItem: foundList.itemsList});
          }
          else console.log(err);
    });
});

app.get("/about", function(req, res)
{
    res.render("about");
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(req, res)
{
    console.log("Server started listening at port 3000");
});
