/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./public/client.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./public/client.js":
/*!**************************!*\
  !*** ./public/client.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("// client-side js\n// run by the browser each time your view template referencing it is loaded\n\nconsole.log(\"hello world :o\");\n\nconst dreams = [];\n\n// define variables that reference elements on our page\nconst dreamsForm = document.forms[0];\nconst dreamInput = dreamsForm.elements[\"dream\"];\nconst dreamsList = document.getElementById(\"dreams\");\nconst clearButton = document.querySelector('#clear-dreams');\n\n// request the dreams from our app's sqlite database\nfetch(\"/getDreams\", {})\n  .then(res => res.json())\n  .then(response => {\n    response.forEach(row => {\n      appendNewDream(row.dream);\n    });\n  });\n\n// a helper function that creates a list item for a given dream\nconst appendNewDream = dream => {\n  const newListItem = document.createElement(\"li\");\n  newListItem.innerText = dream;\n  dreamsList.appendChild(newListItem);\n};\n\n// listen for the form to be submitted and add a new dream when it is\ndreamsForm.onsubmit = event => {\n  // stop our form submission from refreshing the page\n  event.preventDefault();\n\n  const data = { dream: dreamInput.value };\n\n  fetch(\"/addDream\", {\n    method: \"POST\",\n    body: JSON.stringify(data),\n    headers: { \"Content-Type\": \"application/json\" }\n  })\n    .then(res => res.json())\n    .then(response => {\n      console.log(JSON.stringify(response));\n    });\n  // get dream value and add it to the list\n  dreams.push(dreamInput.value);\n  appendNewDream(dreamInput.value);\n\n  // reset form\n  dreamInput.value = \"\";\n  dreamInput.focus();\n};\n\nclearButton.addEventListener('click', event => {\n  fetch(\"/clearDreams\", {})\n    .then(res => res.json())\n    .then(response => {\n      console.log(\"cleared dreams\");\n    });\n  dreamsList.innerHTML = \"\";\n});\n\n//import axios from \"axios\";\n\n//# sourceURL=webpack:///./public/client.js?");

/***/ })

/******/ });