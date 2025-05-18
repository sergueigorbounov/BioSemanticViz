// Polyfill for toPropertyKey function
if (typeof window.toPropertyKey === 'undefined') {
  window.toPropertyKey = function(argument) {
    var key = toPrimitive(argument, String);
    return typeof key === "symbol" ? key : String(key);
  };
  
  function toPrimitive(input, hint) {
    if (typeof input === "object" && input !== null) {
      var exoticToPrim = input[Symbol.toPrimitive];
      if (exoticToPrim !== undefined) {
        var result = exoticToPrim.call(input, hint || "default");
        if (typeof result !== "object") return result;
        throw new TypeError("Cannot convert object to primitive value");
      }
      if (hint === "default") hint = "number";
      return ordinaryToPrimitive(input, hint);
    }
    return input;
  }
  
  function ordinaryToPrimitive(input, hint) {
    if (hint === "string") {
      var toString = input.toString;
      if (typeof toString === "function") {
        var result = toString.call(input);
        if (typeof result !== "object") return result;
      }
      var valueOf = input.valueOf;
      if (typeof valueOf === "function") {
        var result = valueOf.call(input);
        if (typeof result !== "object") return result;
      }
    } else {
      var valueOf = input.valueOf;
      if (typeof valueOf === "function") {
        var result = valueOf.call(input);
        if (typeof result !== "object") return result;
      }
      var toString = input.toString;
      if (typeof toString === "function") {
        var result = toString.call(input);
        if (typeof result !== "object") return result;
      }
    }
    throw new TypeError("Cannot convert object to primitive value");
  }
} 