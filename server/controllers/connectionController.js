const ConnectionRequest = require("../models/ConnectionRequest");

const sendRequest = async (req, res) => {
  try {
    const { to, level } = req.body;
    const request = await ConnectionRequest.create({
      from: req.user._id,
      to,
      level
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: "Error sending request" });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const request = await ConnectionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Only the "to" user can accept
    if (String(request.to) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    request.status = "accepted";
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: "Error accepting request" });
  }
};

const getRequests = async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({
      $or: [{ from: req.user._id }, { to: req.user._id }]
    })
      .populate("from", "username email")
      .populate("to", "username email");
      
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching requests" });
  }
};

module.exports = { sendRequest, acceptRequest, getRequests };