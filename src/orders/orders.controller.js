const path = require("path");
const { update } = require("../dishes/dishes.controller");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderHasValidFields(req, res, next) {
    const { data = {} } = req.body;
    const { deliverTo, mobileNumber, dishes } = data;
    const VALID_FIELDS = ["deliverTo", "mobileNumber", "dishes"];
  
    //Are all required fields present
    for (const field of VALID_FIELDS) {
      if (!data[field]) {
        return next({
          status: 400,
          message: `Order must include a ${field}`,
        });
      }
    }
  
    //Is dish fields are not valid
    if (
      deliverTo === "" ||
      mobileNumber === "" ||
      !Array.isArray(dishes) ||
      dishes.length <= 0
    ) {
      return next({
        status: 400,
        message: `Order must include at least one dish`,
      });
    }
  
    for (const dish of dishes) {
      if (
        !dish.quantity ||
        !Number.isInteger(dish.quantity) ||
        Number(dish.quantity) === 0
      ) {
        return next({
          status: 400,
          message: `Dish ${dishes.indexOf(dish)} must have a quantity that is an integer greater than 0`,
        });
      }

    }
    next();
  }


function list(req, res, next) {
  res.json({
    data: orders,
  });
}


function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = dishes.find((order) => order.id === orderId);

  if (foundDish) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

//CRUD + list

const create = (req, res, next) => {
    const newOrder = {
      id: nextId(),
      ...req.body.data,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  };

  function read(req, res) {
    const foundOrder = res.locals.order
    res.json({ data: foundOrder });
  }

module.exports = {
  list,
  create: [orderHasValidFields, create],
  read: [orderExists, read],
  update,
  //destroy,
};
