const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//Middleware

function dishIsValid(req, res, next) {
  const { data = {} } = req.body;
  const VALID_FIELDS = ["name", "price", "description", "image_url"];

  //field validator
  for (const field of VALID_FIELDS) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Field "${field}" is required`,
      });
    }
  }

  //price validator
  if (typeof data.price !== "number" || data.price < 0) {
    return next({
      status: 400,
      message: `Field 'price' must be a number greater than 0`,
    });
  }
  next();
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

//CRUD + list. NOTE: dishes cannot be deleted, so there is no destroy handler
function list(req, res, next) {
  res.json({
    data: dishes,
  });
}

function create(req, res, next) {
  const { dishId } = req.params;
  const { data = {} } = req.body;
  const { id, name, description, price, image_url } = data;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Data id field ${id}`,
    });
  }

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  const foundDish = res.locals.dish;
  res.json({ data: foundDish });
}

function update(req, res, next) {
  const { dishId } = req.params;
  const { data = {} } = req.body;
  const { id, name, description, price, image_url } = data;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Data id field ${id}`,
    });
  }

  const updatedDish = {
    id: dishId,
    name,
    description,
    price,
    image_url,
  };

  const dish = dishes.find((d) => d.id === dishId);
  Object.assign(dish, updatedDish);

  res.status(200).json({ data: updatedDish });
}

module.exports = {
  list,
  create: [dishIsValid, create],
  read: [dishExists, read],
  update: [dishExists, dishIsValid, update],
};
