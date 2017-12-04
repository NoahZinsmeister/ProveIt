function supportsES6() {
    try {
        new Function("(a = 0) => a");
        return true;
    }
        catch (err) {
            return false;
    }
}
if (!supportsES6()) {
    alert("Please visit from a modern browser that supports ES6.");
}
