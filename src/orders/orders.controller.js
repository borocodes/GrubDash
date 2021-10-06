const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//  Middleware

function statusIsValid(req, res, next) {
  const { data } = req.body;
  const { id, status } = data;

  if (!status || status === "" || status !== "pending") {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next();
}

//Validate order ID when updating order
function updateOrderIdIsValid(req, res, next) {
  const { orderId } = req.params;
  const { data } = req.body;
  const { id } = data;
  if (id && orderId !== data.id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

function orderHasValidFields(req, res, next) {
  const { data = {} } = req.body;
  const { deliverTo, mobileNumber, dishes } = data;
  const VALID_FIELDS = ["deliverTo", "mobileNumber", "dishes"];

  //Are all required order fields present
  for (const field of VALID_FIELDS) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  }
  //If dish fields are not valid (dishes is an array nested inside orders)
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
  //iterate through dish key and validate fields
  for (const dish of dishes) {
    if (
      !dish.quantity ||
      !Number.isInteger(dish.quantity) ||
      Number(dish.quantity) === 0
    ) {
      return next({
        status: 400,
        message: `Dish ${dishes.indexOf(
          dish
        )} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

//Handler to ensure order is pending before deletion
const checkDeleteStatus = (req, res, next) => {
  const { status } = res.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: `status should be pending`,
    });
  }

  return next();
};

//CRUD handlers + list

function list(req, res, next) {
  res.json({
    data: orders,
  });
}

const create = (req, res, next) => {
  const newOrder = {
    id: nextId(),
    ...req.body.data,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

function read(req, res) {
  const foundOrder = res.locals.order;
  res.json({ data: foundOrder });
}

function update(req, res, nect) {
  const { order } = res.locals;
  const { data: update } = req.body;
  for (let prop in update) {
    if (update[prop]) {
      order[prop] = update[prop];
    }
  }
  res.json({ data: order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrder = orders.splice(index, 1);

  res.sendStatus(204);
}

module.exports = {
  list,
  create: [orderHasValidFields, create],
  read: [orderExists, read],
  update: [
    orderExists,
    orderHasValidFields,
    updateOrderIdIsValid,
    statusIsValid,
    update,
  ],
  delete: [orderExists, checkDeleteStatus, destroy],
};
