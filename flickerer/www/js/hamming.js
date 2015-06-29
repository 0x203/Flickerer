// most of this code is copied from:
// http://www.ecs.umass.edu/ece/koren/FaultTolerantSystems/simulator/Hamming/HammingCodes.html
// Thank you guys!

Hamming = (function() {
    var  syndromeMatrix = null;
    var  parityMatrix = null;
    var  SyndromeEditWindow = null;
    var  numberOfSyndromeRows = 0;
    var  numberOfParityBits = 0;

    //*************************************************************************
    //
    //  FUNCTION : log2
    //
    //  INPUTS : operand:  the number for which log base 2 will be
    //                  returned
    //
    //  DESCRIPTION : returns log2(operand)
    //
    //  OUTPUTS : none
    //
    //  RETURNS : returns log2(operand)
    //*************************************************************************
    function log2(operand)
    {
        return Math.log(operand)/Math.LN2;
    }

    //*************************************************************************
    //
    //  FUNCTION : numberIsValid
    //
    //  INPUTS : inputString:  A string that holds an signed digit number
    //              to check
    //      radix:  The radix of the signed decimal number
    //
    //  DESCRIPTION : Examines each character of inputString
    //          and determines whether  the character represents a
    //          valid digit given radix
    //
    //  OUTPUTS : none
    //
    //  RETURNS : Returns true if inputString is a valid signed digit
    //      representation in radix, false otherwise.
    //
    //*************************************************************************
    function numberIsValid(inputString, radix)
    {
        var digitsAreValid = true;
        var currentDigit = 0;

        i=0;
        while(i < inputString.length && digitsAreValid)
        {
            currentDigit = parseInt(inputString.charAt(i), radix);

            if (isNaN(currentDigit))
                digitsAreValid = false;
            i++;
        }

        return digitsAreValid;
    }

    //*************************************************************************
    //
    //  FUNCTION : stringToBinaryArray
    //
    //  INPUTS : inputString:  A string that holds a binary or hex number
    //                      to convert to a binary array
    //          radix:  The radix of the signed decimal number
    //          resultantArray: The array that will hold the number after conversion
    //          requiredNumberOfDigits: the total number of digits that the
    //                              returned array should hold.
    //
    //  DESCRIPTION : Converts each digit in inputString to its numberic value (0,1)
    //      and places the value in resultantArray. If the input string is in
    //      hex, the hex string is converted to binary before converting it into
    //      an array.
    //
    //      If requiredNumberOfDigits is greater than the length of inputString,
    //      the beginning of the array is padded with 0's to create a total of
    //      requiredNumberOfDigits positions in resultantArray.  If
    //      requiredNumberOfDigits is less than the length of inputString,
    //      requiredNumberOfDigits is ignored.
    //
    //  OUTPUTS : resultantArray
    //
    //  RETURN : true if conversion succeeded, false otherwise
    //
    //*************************************************************************
    function stringToBinaryArray(radix, inputString, resultantArray, requiredNumberOfDigits)
    {
        var     value = 0;
        var     currentResultantArrayIndex = requiredNumberOfDigits - 1;
        var     tempInputString = "";
        var     hexDigit,
            binDigits;
        var i = 0,
            j = 0;

        //  If inputString does not represent a valid value in the give radix, return
        if ((!numberIsValid(inputString, radix)) || (inputString.length === 0))
        {
            resultantArray.length = 0;
            return false;
        }

        //  If the input string is in hex, convert the hex string to binary before
        //  converting it into an array.
        if (radix == 16)
        {
            for (i = inputString.length; i > 0; i--)
            {
                hexDigit = inputString.charAt(inputString.length-i);

                switch (hexDigit)
                {
                    case "0":
                        binDigits = "0000";
                        break;
                    case "1":
                        binDigits = "0001";
                        break;
                    case "2":
                        binDigits = "0010";
                        break;
                    case "3":
                        binDigits = "0011";
                        break;
                    case "4":
                        binDigits = "0100";
                        break;
                    case "5":
                        binDigits = "0101";
                        break;
                    case "6":
                        binDigits = "0110";
                        break;
                    case "7":
                        binDigits = "0111";
                        break;
                    case "8":
                        binDigits = "1000";
                        break;
                    case "9":
                        binDigits = "1001";
                        break;
                    case "a":
                    case "A":
                        binDigits = "1010";
                        break;
                    case "b":
                    case "B":
                        binDigits = "1011";
                        break;
                    case "c":
                    case "C":
                        binDigits = "1100";
                        break;
                    case "d":
                    case "D":
                        binDigits = "1101";
                        break;
                    case "e":
                    case "E":
                        binDigits = "1110";
                        break;
                    case "f":
                    case "F":
                        binDigits = "1111";
                }

                tempInputString = tempInputString.concat(binDigits);
            }
        }
        else
            tempInputString = inputString;

        //  Convert binary string to an array of 1's and 0's
        if (requiredNumberOfDigits > tempInputString.length)
            resultantArray.length = requiredNumberOfDigits;
        else
            resultantArray.length = tempInputString.length;

        //  Zero pad the array if necessary to get requiredNumberOfDigits
        //  number of digits
        j = resultantArray.length-1;
        if (requiredNumberOfDigits !== undefined)
        {
            //  zero pad the beginning of the array
            for (j = resultantArray.length-1; j >= tempInputString.length; j--)
                resultantArray[j] = 0;
        }
        currentResultantArrayIndex = j;

        //  Convert each character of inputString to a number and add the
        //  resultant number to the end of resultantArray.
        i=0;
        while (i < tempInputString.length)
        {
            if (tempInputString.charAt(i) == "0")
                value = 0;
            else
                value = 1;

            //  Place value in resultantArray starting at the MOST SIGNIFICANT BIT
            resultantArray[currentResultantArrayIndex] = value;
            currentResultantArrayIndex--;
            i++;
        }
        return true;
    }

    //*************************************************************************
    //
    //  FUNCTION : binaryArrayToString
    //
    //  INPUTS : inputArray:  An array such that each element holds a digit
    //                      of a binary number (0 or 1) to convert to a
    //                      string. inputArray[0] is the LSB.
    //
    //  DESCRIPTION : Converts each digit in inputArray to its string
    //              representation ("0","1") and places the value in
    //              resultantString.
    //
    //  OUTPUTS : none
    //
    //  RETURNS : The string representation of inputArray.
    //          String will be empty if the resultant string does
    //          not represent a valid binary number
    //
    //*************************************************************************
    function binaryArrayToString(inputArray)
    {
        var     value = 0;
        var     i = 0;
        var  resultantString = "";

        for (i=inputArray.length-1; i >= 0 ; i--)
            resultantString = resultantString + inputArray[i].toString();

        //  make sure that the new string is represents a valid
        //  binary number
        if (!numberIsValid(resultantString, 2))
            return "";

        return resultantString;
    }

    //*************************************************************************
    //
    //  FUNCTION : createSyndromeAndParityMatrices
    //
    //  INPUTS :
    //      useExtraParityBit : true if an extra parity bit is to be used
    //
    //  DESCRIPTION :
    //
    //  OUTPUTS : none
    //
    //  RETURNS : none
    //
    //*************************************************************************
    function createSyndromeAndParityMatrices(useExtraParityBit,
                            inputDataLength)
    {
        var         i = 0,
                j = 0;
        var     syndrome = 1;
        var         syndromeArray = new Array(numberOfSyndromeRows);
        var     parityColumn = 0,
                syndromeColumn = 0;

        //  find number of parity bits
        numberOfParityBits = 0;
        while (Math.pow(2.0, numberOfParityBits) <  (numberOfParityBits + inputDataLength + 1))
            numberOfParityBits++;

        numberOfSyndromeRows = Math.ceil(log2(inputDataLength + numberOfParityBits + 1));

        //  Add an extra parity bit if the extra parity bit
        //  is in use.  The number of syndrome rows is adjusted
        //  at the end of the function (this makes it easier
        //  to build the syndrome array).
        if (useExtraParityBit)
        {
            numberOfParityBits++;
            numberOfSyndromeRows++;
        }

        // Initialize parityMatrix
        parityMatrix = new Array(numberOfSyndromeRows);
        for (i=0; i < numberOfSyndromeRows; i++)
        {
            parityMatrix[i] = new Array(numberOfParityBits);

            for (j=0; j < numberOfParityBits; j++)
                parityMatrix[i][j] = 0;
        }

        // Initialize syndromeMatrix and parityMatrix
        syndromeMatrix = new Array(numberOfSyndromeRows);
        for (i=0; i < numberOfSyndromeRows; i++)
        {
            syndromeMatrix[i] = new Array(inputDataLength);

            for (j=0; j < inputDataLength; j++)
                syndromeMatrix[i][j] = 0;

            for (j=0; j < numberOfParityBits; j++)
                parityMatrix[i][j] = 0;
        }

        // Generate syndromes for syndromeMatrix and parityMatrix
        for (i = 0; i < numberOfParityBits + inputDataLength; i++)
        {
            //  Create an array that holds the syndrome
            //  translated to a binary number.  Note that if
            //  the extra parity bit is in use, the number
            //  of digits in the syndrome is numberOfSyndromeRows - 1
            //  because the last row of the syndrome matrix will be all 1's
            if (useExtraParityBit)
                stringToBinaryArray(2,
                                syndrome.toString(2),
                                syndromeArray,
                                numberOfSyndromeRows - 1);
            else
                stringToBinaryArray(2,
                                syndrome.toString(2),
                                syndromeArray,
                                numberOfSyndromeRows);

            //  If the current syndrome is a power of 2, then it belongs
            //  to the parity matrix
            if (syndrome.valueOf() == Math.pow(2, parityColumn))
            {
                //  Add the syndrome to the parity matrix
                for (j=0; j < syndromeArray.length; j++)
                    parityMatrix[j][parityColumn] = syndromeArray[j];

                parityColumn++;
            }
            //  Otherwise, the syndrome applies to a data bit
            else
            {
                //  Add the syndrome to the syndrome matrix
                for (j=0; j < syndromeArray.length; j++)
                    syndromeMatrix[j][syndromeColumn] = syndromeArray[j];

                syndromeColumn++;
            }

            syndrome++;
        }

        //  if we are to use an extra parity bit, append the extra
        //  bit to both the syndrome and the parity matricies
        if (useExtraParityBit)
        {
            for (i=0; i < inputDataLength; i++)
                syndromeMatrix[numberOfSyndromeRows-1][i] = 1;

            //  if the extra parity bit is being used, the parity
            //  matrix that was passed in already has the correct
            //  size.  All that needs to be done here is to add the
            //  extra parity bits.
            for (i=0; i < numberOfParityBits; i++)
                parityMatrix[numberOfSyndromeRows-1][i] = 1;
        }
    }

    function reset()
    {
        syndromeMatrix = null;
        parityMatrix = null;
        numberOfSyndromeRows = 0;
        numberOfParityBits = 0;
    }

    function encode(binaryString, useExtraParityBit)
    {
        if (!numberIsValid(binaryString, 2)) {
            console.error('Invlaid binary string!');
        }

        var codewordLength = 0;
        var inputDataLength = binaryString.length;
        var inputDataParity = "";
        var extraParityBit = "";
        var  parityBit = 0;
        var  i = 0,
             j = 0;
        var  parityValue = 0;
        var  dataArray = new Array(inputDataLength);
        var  returnValue = false;

        //  convert input data to bianry array for parity bits calculation
        returnValue = stringToBinaryArray(2, binaryString, dataArray, inputDataLength);
        if (!returnValue) {
            console.error('Could not create binary array. Please check input!');
            return;
        }

        createSyndromeAndParityMatrices(useExtraParityBit, inputDataLength);
        codewordLength = numberOfParityBits + inputDataLength;

        //  calculate parity
        //  Start with most significant parity bit, bitwise AND the
        //  input data with each row of the syndrome matrix and
        //  XOR the resulting bits to obtain each parity value
        for (parityBit = numberOfParityBits - 1; parityBit >= 0; parityBit--)
        {
            parityValue = syndromeMatrix[parityBit][0] & dataArray[0];
            for (i=1; i < inputDataLength; i++)
                parityValue = parityValue ^ (syndromeMatrix[parityBit][i] & dataArray[i]);

            inputDataParity += parityValue.toString();
        }

        //  if using the extra parity bit, calculate the extra parity for all of the other bits
        if (useExtraParityBit)
        {
            //  start at index 1 in the inputDataParity string to skip the extra parity bit
            parityValue = parseInt(inputDataParity.charAt(1));
            for (i=2; i < inputDataParity.length; i++)
                parityValue = parityValue ^ parseInt(inputDataParity.charAt(i));

            for (i=0; i < dataArray.length; i++)
                parityValue = parityValue ^ parseInt(dataArray[i]);

            //  set the extra parity bit (character 0 in the inputDataParity string)
            inputDataParity = parityValue.toString() + inputDataParity.substring(1, inputDataParity.length);
        }

        //  Fill in the receivedDataTextbox with the codeword
        return binaryArrayToString(dataArray) + inputDataParity;
    }

    var decode = function(hammingString) {
        console.error('Not implemented');
    };


    return {
        encode: encode,
        decode: decode
    };
})();
