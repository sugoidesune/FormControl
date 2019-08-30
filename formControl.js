/* exported Validators */
/* exported FormGroup */
var Validators = {
    pattern: function(pattern, validationName){
        validationName = typeof validationName === 'undefined' ? 'validation' : validationName
        return function () {
            return [!!this.value.match(pattern), validationName]
        }
    },
    required: function(){
        //window.console.log('required status', !this.empty);
        return [!this.empty, 'empty']
    },
    email: function(){
        return [!!this.value.match(/^\S+@\S+\.\S+$/), 'email']
    },
    equals: function(valueGetter, validationName){
        validationName = typeof validationName === 'undefined' ? 'equals' : validationName
        return function () {
            if(typeof valueGetter === 'function') {
                return  [valueGetter.call(this) == this.value, validationName]
            }
            else {
                return [valueGetter == this.value, validationName]
            }
        }
    },
    //get control in same FormGroup
    siblingControl: function(controlName){
        return function() { return this.FormGroup[controlName].value}
    }
}

/**
     * @param {String} inputID id attribute of input, checkbox or any radio input.
     * @param {Array} validators array of functions to receive ElementRef as argument to the return true if validation passed.
     * {Object} InputControl.events 
     */
    class InputControl {
        constructor(inputID, validatorsArray, FormGroup){
            this.ElementRef = window.document.getElementById(inputID)
            this.ElementId = inputID
            if(FormGroup){this.FormGroup = FormGroup}
            this.validators = validatorsArray
            this.inputType = this.ElementRef.type
            this._actionByControlType() // set action based on input type: checkbox/radio/input
            this._touched = false;
            this.value = ''
            this.failedValidator = ''
            this.valid = '';
            this.events = {}
            this.updateValue()
            this.runValidation()
        }
        //updateValue(){}
        //get empty(){}
        set touched(boolean){
            this._touched = boolean;
            if(boolean){ this.ElementRef.classList.add("touched") }
            else{ this.ElementRef.classList.remove("touched")}
        }
        get touched(){return this._touched}
        onChange(){
            if(typeof this.events.onChange === "function")(this.events.onChange.call(this,this))
        }
        onInput(){
            if(typeof this.events.onInput === "function")(this.events.onInput.call(this,this))
            this.updateValue()
            this.runValidation()
        }
        onBlur(){
            if(!this.touched){this.touched = true}
            if(typeof this.events.onBlur === "function")(this.events.onBlur.call(this,this))
        }
        onFocus(){
            if(typeof this.events.onFocus === "function")(this.events.onFocus.call(this,this))
        }
        runValidation(){
            this.valid =  !this.validators.find(function(validator){
                var validatorResult = validator.call(this,this.value, this.empty)
                this.failedValidator = validatorResult[1]
                    return !validatorResult[0] // needs true to return value.
                }.bind(this))
            this.failedValidator = this.valid ? "" : this.failedValidator
        }
        _actionByControlType(){
            if(this.inputType == "text" || this.inputType == "password"){
            this._addEventListener(this.ElementRef)
            this.updateValue = function(){ this.value = this.ElementRef.value};
            Object.defineProperty(this,"empty", {
                get : function(){
                    return !this.value.length // 0 is false num is true
                }
            })
            }

            if(this.inputType == "radio"){
                document.querySelectorAll('input[name="'+this.ElementRef.name+'"]').forEach(
                    function(radioElementRef){this._addEventListener(radioElementRef) }.bind(this))
                this.updateValue = function(){
                    //because cant get value of undefined if none is selected.
                    try {this.value = document.querySelector('input[name="'+this.ElementRef.name+'"]:checked').value}
                    catch(e) { this.value = ""}
                    //this.value = document.querySelector('input[name="'+this.ElementRef.name+'"]:checked') ? document.querySelector('input[name="'+this.ElementRef.name+'"]:checked').value : ""
                }
                Object.defineProperty(this,"empty", {
                    get : function(){
                        return !this.value.length
                    }
                })
            }

            if(this.inputType == "checkbox"){
                this._addEventListener(this.ElementRef)
                this.updateValue = function(){ this.value = this.ElementRef.checked }
                Object.defineProperty(this,"empty", {
                    get : function(){
                        return !this.value
                    }
                })
            }
        }
        _addEventListener(ElementRef){
            ElementRef.addEventListener("change", this.onChange.bind(this))
            ElementRef.addEventListener("focus", this.onFocus.bind(this))
            ElementRef.addEventListener("blur", this.onBlur.bind(this))
            ElementRef.addEventListener("input", this.onInput.bind(this))
        }
        // _defineProperty(property, type ,propertyValue){
        //     Object.defineProperty(this, property, propertyValue)
        // }
    }

    class FormGroup {
        constructor (FromGroupControls, properties) {
            this.array = [];
            Object.keys(FromGroupControls).forEach(function(InputControlName){
                var inputControlArguments = [FromGroupControls[InputControlName].slice(0)] // copy original arguments
                inputControlArguments.unshift('placeholderforhack',InputControlName)  // add 2 arguments in the beginning ['placeholderforhack',inputID (from objectkey), mandatory, validation]
                inputControlArguments.push(this) // this argument allows each inputControl to know in which formGroup it is and thus allows it, to communicate with them.
                this[InputControlName] = new (Function.prototype.bind.apply(InputControl,inputControlArguments))() //hack to use apply on class constructor
               this.array.push(this[InputControlName])
            }.bind(this))
            if(properties){
                if(properties.eventCallbacks){
                    Object.keys(properties.eventCallbacks).forEach(function(event){
                        this.array.forEach(function(InputControl){
                            InputControl.events[event] = properties.eventCallbacks[event]
                        })
                    }.bind(this))
                }
            }
        }
        firstInvalid(){
            return this.array.find(function(inputControl){return !inputControl.valid}) // if nothing foud(all valid) returns undefined
        }
        getValue(string){
            //console.log(this[string].value)
            return this[string].value
        }
    }
