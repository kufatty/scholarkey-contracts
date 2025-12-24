// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AcademicVerificationSystem
 * @dev A decentralized academic verification system for UCAB with multi-level approval workflow
 * and granular access control for student grade privacy.
 */
contract AcademicVerificationSystem {
    
    // ============================================
    // PHASE 1: CORE STRUCTURES AND STATE VARIABLES
    // ============================================
    
    /**
     * @dev Enum representing different user roles in the system
     */
    enum Role {
        None,           // 0 - Default/unassigned role
        Student,        // 1 - Can view own grades, manage access
        Teacher,        // 2 - Can create and sign initial grades
        DepartmentHead, // 3 - Can verify teacher-submitted grades
        GeneralDirector // 4 - Can ratify and finalize grades
    }
    
    /**
     * @dev Status tracking for grade approval workflow
     */
    enum GradeStatus {
        Pending,        // 0 - Created but not verified
        DepartmentVerified, // 1 - Verified by department head
        DirectorApproved,   // 2 - Approved by general director
        Finalized       // 3 - Fully approved and immutable
    }
    
    /**
     * @dev Structure representing a single academic grade record
     * @param id Unique identifier for the grade record
     * @param student Address of the student
     * @param courseCode Code identifying the course (e.g., "MAT101")
     * @param grade Numerical grade (0-20 scale)
     * @param semester Academic semester (e.g., "2024-1")
     * @param teacher Address of the teacher who created the grade
     * @param teacherSignature Hash of teacher's digital signature
     * @param departmentHead Address of department head who verified
     * @param departmentSignature Hash of department's verification
     * @param generalDirector Address of general director who ratified
     * @param directorSignature Hash of director's ratification
     * @param status Current status in the approval workflow
     * @param createdAt Timestamp when grade was created
     * @param updatedAt Timestamp of last update
     * @param finalizedAt Timestamp when grade was finalized (if applicable)
     */
    struct GradeRecord {
        uint256 id;
        address student;
        string courseCode;
        uint256 grade;
        string semester;
        address teacher;
        bytes32 teacherSignature;
        address departmentHead;
        bytes32 departmentSignature;
        address generalDirector;
        bytes32 directorSignature;
        GradeStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 finalizedAt;
    }
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /**
     * @dev Official UCAB university address (deployer/owner)
     */
    address public universityAddress;
    
    /**
     * @dev Counter for generating unique grade IDs
     */
    uint256 private _gradeCounter;
    
    /**
     * @dev Mapping from user address to their role
     */
    mapping(address => Role) public userRoles;
    
    /**
     * @dev Mapping from grade ID to GradeRecord
     */
    mapping(uint256 => GradeRecord) public gradeRecords;
    
    /**
     * @dev Mapping from student address to array of their grade IDs
     */
    mapping(address => uint256[]) private _studentGradeIds;
    
    /**
     * @dev Mapping for student-controlled access permissions
     * @notice studentAddress => viewerAddress => hasAccess
     */
    mapping(address => mapping(address => bool)) public accessPermissions;
    
    /**
     * @dev Mapping from course code to course name (for better UX)
     */
    mapping(string => string) public courseNames;
    
    /**
     * @dev Mapping to check if a specific signature hash has been used (prevents replay attacks)
     */
    mapping(bytes32 => bool) private _usedSignatures;

    /**
     * @dev Array to track all registered course codes
     */
    string[] private _registeredCourseCodes;

      /**
     * @dev Mapping from student address to list of granted viewer addresses
     * @notice studentAddress => array of viewer addresses
     */
    mapping(address => address[]) private _grantedAccessListByStudent;
    
    /**
     * @dev Mapping from (studentAddress, viewerAddress) => index in the _grantedAccessListByStudent array
     * Used for O(1) lookup when revoking access
     */
    mapping(address => mapping(address => uint256)) private _grantedAccessIndex;
    
    /**
     * @dev Minimum grade value (0)
     */
    uint256 public constant MIN_GRADE = 0;
    
    /**
     * @dev Maximum grade value (20-point scale)
     */
    uint256 public constant MAX_GRADE = 20;
    
    /**
     * @dev Minimum course code length
     */
    uint256 public constant MIN_COURSE_CODE_LENGTH = 3;
    
    /**
     * @dev Maximum course code length
     */
    uint256 public constant MAX_COURSE_CODE_LENGTH = 20;
    
    // ============================================
    // EVENTS - SIMPLIFIED VERSION
    // ============================================
    
    // Core workflow events
    event GradeCreated(uint256 indexed gradeId, address indexed student, address indexed teacher);
    event GradeVerified(uint256 indexed gradeId, address departmentHead);
    event GradeRatified(uint256 indexed gradeId, address generalDirector);
    event GradeFinalized(uint256 indexed gradeId);
    
    // Role management events
    event RoleAssigned(address indexed user, Role role);
    event RoleRevoked(address indexed user, Role role);
    
    // Access control events
    event AccessGranted(address indexed student, address indexed viewer);
    event AccessRevoked(address indexed student, address indexed viewer);
    
    // Course management events
    event CourseRegistered(string indexed courseCode, string courseName);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyUniversity() {
        require(msg.sender == universityAddress, "Caller is not the university");
        _;
    }
    
    modifier onlyStudent() {
        require(userRoles[msg.sender] == Role.Student, "Caller is not a student");
        _;
    }
    
    modifier onlyTeacher() {
        require(userRoles[msg.sender] == Role.Teacher, "Caller is not a teacher");
        _;
    }
    
    modifier onlyDepartmentHead() {
        require(userRoles[msg.sender] == Role.DepartmentHead, "Caller is not a department head");
        _;
    }
    
    modifier onlyGeneralDirector() {
        require(userRoles[msg.sender] == Role.GeneralDirector, "Caller is not a general director");
        _;
    }
    
    modifier validGradeId(uint256 gradeId) {
        require(gradeId > 0 && gradeId <= _gradeCounter, "Invalid grade ID");
        require(gradeRecords[gradeId].id == gradeId, "Grade record does not exist");
        _;
    }
    
    modifier validGradeValue(uint256 grade) {
        require(grade >= MIN_GRADE && grade <= MAX_GRADE, "Grade value out of range (0-20)");
        _;
    }
    
    modifier validCourseCode(string memory courseCode) {
        bytes memory codeBytes = bytes(courseCode);
        require(codeBytes.length >= MIN_COURSE_CODE_LENGTH, "Course code too short");
        require(codeBytes.length <= MAX_COURSE_CODE_LENGTH, "Course code too long");
        _;
    }
    
    modifier onlyStudentOrWithAccess(uint256 gradeId) {
        GradeRecord storage record = gradeRecords[gradeId];
        require(
            msg.sender == record.student || 
            accessPermissions[record.student][msg.sender] ||
            userRoles[msg.sender] == Role.Teacher ||
            userRoles[msg.sender] == Role.DepartmentHead ||
            userRoles[msg.sender] == Role.GeneralDirector,
            "No access to this grade"
        );
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    /**
     * @dev Initializes the contract with the university address
     * @param _universityAddress The official UCAB address
     */
    constructor(address _universityAddress) {
        require(_universityAddress != address(0), "Invalid university address");
        universityAddress = _universityAddress;
        _gradeCounter = 0;
        
        // Assign the deployer as the initial university admin
        userRoles[_universityAddress] = Role.GeneralDirector;
        
        emit RoleAssigned(_universityAddress, Role.GeneralDirector);
    }
    
    // ============================================
    // ROLE MANAGEMENT FUNCTIONS
    // ============================================
    
    /**
     * @dev Assigns a role to a user (only callable by university)
     * @param user Address of the user to assign role to
     * @param role Role to assign
     */
    function assignRole(address user, Role role) external onlyUniversity {
        require(user != address(0), "Invalid user address");
        require(role != Role.None, "Cannot assign 'None' role");
        
        userRoles[user] = role;
        emit RoleAssigned(user, role);
    }
    
    /**
     * @dev Revokes a user's role (only callable by university)
     * @param user Address of the user to revoke role from
     */
    function revokeRole(address user) external onlyUniversity {
        require(user != address(0), "Invalid user address");
        require(userRoles[user] != Role.None, "User has no role assigned");
        
        Role previousRole = userRoles[user];
        userRoles[user] = Role.None;
        emit RoleRevoked(user, previousRole);
    }
    
    // ============================================
    // COURSE MANAGEMENT FUNCTIONS
    // ============================================
    
    /**
     * @dev Registers a new course or updates an existing one
     * @param courseCode Unique code for the course
     * @param courseName Full name of the course
     */
    function registerCourse(
        string memory courseCode, 
        string memory courseName
    ) external onlyUniversity validCourseCode(courseCode) {
        require(bytes(courseName).length > 0, "Course name cannot be empty");
        
        // Check if course already registered
        if (bytes(courseNames[courseCode]).length == 0) {
            _registeredCourseCodes.push(courseCode);
        }
        
        courseNames[courseCode] = courseName;
        emit CourseRegistered(courseCode, courseName);
    }
    
    // ============================================
    // ACCESS CONTROL FUNCTIONS
    // ============================================
    
    /**
     * @dev Allows a student to grant view access to their grades
     * @param viewer Address to grant access to
     */
    function grantAccess(address viewer) external onlyStudent {
        require(viewer != msg.sender, "Cannot grant access to yourself");
        require(!accessPermissions[msg.sender][viewer], "Access already granted");
        
        accessPermissions[msg.sender][viewer] = true;
        
        // Add to granted access list
        _grantedAccessListByStudent[msg.sender].push(viewer);
        // Store the index for O(1) removal
        _grantedAccessIndex[msg.sender][viewer] = _grantedAccessListByStudent[msg.sender].length - 1;
        
        emit AccessGranted(msg.sender, viewer);
    }
    
    /**
     * @dev Allows a student to revoke view access from an address
     * @param viewer Address to revoke access from
     */
    function revokeAccess(address viewer) external onlyStudent {
        require(accessPermissions[msg.sender][viewer], "Access not granted");
        
        accessPermissions[msg.sender][viewer] = false;
        
        // Remove from granted access list
        uint256 index = _grantedAccessIndex[msg.sender][viewer];
        uint256 lastIndex = _grantedAccessListByStudent[msg.sender].length - 1;
        
        if (index != lastIndex) {
            // Move the last element to the position of the element to delete
            address lastViewer = _grantedAccessListByStudent[msg.sender][lastIndex];
            _grantedAccessListByStudent[msg.sender][index] = lastViewer;
            _grantedAccessIndex[msg.sender][lastViewer] = index;
        }
        
        // Remove the last element
        _grantedAccessListByStudent[msg.sender].pop();
        // Clear the index mapping
        delete _grantedAccessIndex[msg.sender][viewer];
        
        emit AccessRevoked(msg.sender, viewer);
    }
    
    // ============================================
    // VIEW FUNCTIONS FOR PHASE 1
    // ============================================
    
    /**
     * @dev Returns the role of a specific user
     * @param user Address to check
     * @return Role of the user
     */
    function getUserRole(address user) external view returns (Role) {
        return userRoles[user];
    }
    
    /**
     * @dev Returns total number of grade records in the system
     * @return Total grade count
     */
    function getTotalGrades() external view returns (uint256) {
        return _gradeCounter;
    }
    
    /**
     * @dev Returns the number of grades for a specific student
     * @param student Address of the student
     * @return Number of grades
     */
    function getStudentGradeCount(address student) external view returns (uint256) {
        return _studentGradeIds[student].length;
    }
    
    /**
     * @dev Returns all grade IDs for a specific student
     * @param student Address of the student
     * @return Array of grade IDs
     */
    function getStudentGradeIds(address student) external view returns (uint256[] memory) {
        return _studentGradeIds[student];
    }
    
    /**
     * @dev Returns basic grade info without sensitive workflow details
     * @param gradeId ID of the grade to view
     * @return student Student address
     * @return courseCode Course code
     * @return grade Numerical grade
     * @return semester Academic semester
     * @return status Current status
     */
    function getGradeInfo(uint256 gradeId) 
        external 
        view 
        validGradeId(gradeId)
        onlyStudentOrWithAccess(gradeId)
        returns (
            address student,
            string memory courseCode,
            uint256 grade,
            string memory semester,
            GradeStatus status
        )
    {
        GradeRecord storage record = gradeRecords[gradeId];
        return (
            record.student,
            record.courseCode,
            record.grade,
            record.semester,
            record.status
        );
    }
    
    /**
     * @dev Returns the course name for a given course code
     * @param courseCode Course code to lookup
     * @return Course name if registered, empty string otherwise
     */
    function getCourseName(string memory courseCode) external view returns (string memory) {
        return courseNames[courseCode];
    }
    
    /**
     * @dev Checks if a viewer has access to a student's grades
     * @param student Address of the student
     * @param viewer Address of the potential viewer
     * @return True if viewer has access
     */
    function hasAccess(address student, address viewer) public view returns (bool) {
        // Grant access to:
        // 1. The student themselves
        // 2. University officials (Teacher, DepartmentHead, GeneralDirector)
        // 3. Explicitly granted access by the student
        return viewer == student || 
               userRoles[viewer] == Role.Teacher ||
               userRoles[viewer] == Role.DepartmentHead ||
               userRoles[viewer] == Role.GeneralDirector ||
               accessPermissions[student][viewer];
    }

    /**
     * @dev Returns all grade IDs in the system (for admin/overview)
     * @return Array of all grade IDs
     */
    function getAllGradeIds() external view returns (uint256[] memory) {
        uint256[] memory allGradeIds = new uint256[](_gradeCounter);
        
        for (uint256 i = 0; i < _gradeCounter; i++) {
            allGradeIds[i] = i + 1; // Grade IDs start from 1
        }
        
        return allGradeIds;
    }

    /**
     * @dev Returns addresses of all students with grades in the system
     * @return Array of student addresses
     */
    function getAllStudentsWithGrades() external view returns (address[] memory) {
        uint256 count = 0;
        
        // First count unique students
        for (uint256 i = 1; i <= _gradeCounter; i++) {
            if (_studentGradeIds[gradeRecords[i].student].length > 0) {
                bool exists = false;
                // Check if we've already counted this student
                for (uint256 j = 1; j < i; j++) {
                    if (gradeRecords[j].student == gradeRecords[i].student) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) count++;
            }
        }
        
        // Now collect addresses
        address[] memory students = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _gradeCounter; i++) {
            if (_studentGradeIds[gradeRecords[i].student].length > 0) {
                bool exists = false;
                for (uint256 j = 0; j < index; j++) {
                    if (students[j] == gradeRecords[i].student) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    students[index] = gradeRecords[i].student;
                    index++;
                }
            }
        }
        
        return students;
    }

    /**
     * @dev Returns all registered course codes
     * @return Array of course codes
     */
    function getAllCourseCodes() external view returns (string[] memory) {
        return _registeredCourseCodes;
    }

    /**
     * @dev Returns all addresses that have been granted access by a student
     * @param student Address of the student
     * @return Array of viewer addresses with access
     */
    function getGrantedAccessList(address student) external view returns (address[] memory) {
        return _grantedAccessListByStudent[student];
    }
    
    // ============================================
    // INTERNAL HELPER FUNCTIONS
    // ============================================
    
    /**
     * @dev Internal function to add a grade ID to a student's record
     * @param student Address of the student
     * @param gradeId ID of the grade to add
     */
    function _addGradeToStudent(address student, uint256 gradeId) internal {
        _studentGradeIds[student].push(gradeId);
    }
    
    /**
     * @dev Internal function to generate a signature hash
     * @param gradeId ID of the grade
     * @param signer Address of the signer
     * @param action Type of action (create/verify/ratify)
     * @return bytes32 signature hash
     */
    function _generateSignatureHash(
    uint256 gradeId,
    address signer,
    string memory action
    ) internal view returns (bytes32) {
        GradeRecord storage record = gradeRecords[gradeId];
        return keccak256(
            abi.encodePacked(
                gradeId,
                record.student,
                record.courseCode,
                record.grade,
                record.semester,
                signer,
                action,
                record.createdAt  
            )
        );
    }
        
    /**
     * @dev Internal function to validate a signature hasn't been reused
     * @param signatureHash Hash to validate
     */
    function _validateSignatureUniqueness(bytes32 signatureHash) internal view {
        require(!_usedSignatures[signatureHash], "Signature has already been used");
    }
    
    /**
     * @dev Internal function to mark a signature as used
     * @param signatureHash Hash of the used signature
     */
    function _markSignatureUsed(bytes32 signatureHash) internal {
        _usedSignatures[signatureHash] = true;
    }
    
    /**
     * @dev Internal function to get the next grade ID
     * @return Next available grade ID
     */
    function _getNextGradeId() internal returns (uint256) {
        _gradeCounter++;
        return _gradeCounter;
    }

        // ============================================
    // CORE WORKFLOW FUNCTIONS
    // ============================================

    // The teacher creates a new grade record for a student. This is the first step in the
    // three-tier verification process. The teacher must be assigned the Teacher role and
    // the student must have the Student role. The grade is recorded with the teacher's
    // digital signature, which prevents tampering and ensures accountability.
    function createGrade(
        address student,
        string memory courseCode,
        uint256 grade,
        string memory semester
    )
        external
        onlyTeacher
        validGradeValue(grade)
        validCourseCode(courseCode)
        returns (uint256)
    {
        // Ensure the student has been assigned the Student role in the system.
        // This prevents teachers from creating grades for unauthorized addresses.
        require(userRoles[student] == Role.Student, "Student role required");

        // Check that the course has been registered in the system.
        // This ensures consistency and allows for proper course name display.
        require(bytes(courseNames[courseCode]).length > 0, "Course not registered");

        // Generate a unique grade ID for this new record.
        // This ID will be used to reference the grade throughout its lifecycle.
        uint256 gradeId = _getNextGradeId();

        // Store the grade record with initial status set to Pending.
        // The grade is not yet verified and awaits department head review.
        gradeRecords[gradeId] = GradeRecord({
            id: gradeId,
            student: student,
            courseCode: courseCode,
            grade: grade,
            semester: semester,
            teacher: msg.sender,
            teacherSignature: bytes32(0), // Empty for now
            departmentHead: address(0),
            departmentSignature: bytes32(0),
            generalDirector: address(0),
            directorSignature: bytes32(0),
            status: GradeStatus.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            finalizedAt: 0
        });

        // NOW we generate signature (record exists in storage)
        bytes32 teacherSig = _generateSignatureHash(gradeId, msg.sender, "create");

        // Update record with signature
        gradeRecords[gradeId].teacherSignature = teacherSig;

        // Add this grade ID to the student's personal grade index.
        // This allows efficient lookup of all grades belonging to a specific student.
        _addGradeToStudent(student, gradeId);

        // Mark the teacher's signature as used to prevent replay attacks.
        // This ensures the same signature cannot be reused for another grade.
        _markSignatureUsed(teacherSig);

        // Emit an event so external applications can track grade creation.
        // This is particularly useful for building user interfaces that need to
        // display real-time updates when new grades are added.
        emit GradeCreated(gradeId, student, msg.sender);

        return gradeId;
    }

    // The department head verifies a grade that was previously created by a teacher.
    // This represents the second level in the verification hierarchy. Only grades in
    // Pending status can be verified, and the verifier must have DepartmentHead role.
    function verifyGrade(uint256 gradeId)
        external
        onlyDepartmentHead
        validGradeId(gradeId)
    {
        // Retrieve the grade record from storage. We'll be updating it.
        GradeRecord storage record = gradeRecords[gradeId];

        // Ensure the grade is in the correct state for verification.
        // Department heads can only verify grades that are still pending and
        // have not yet been verified by another department head.
        require(
            record.status == GradeStatus.Pending,
            "Grade not in pending status"
        );

        // Create the department head's digital signature for this verification.
        // This signature serves as cryptographic proof that the department has
        // reviewed and approved the teacher's original grade entry.
        bytes32 deptSig = _generateSignatureHash(gradeId, msg.sender, "verify");

        // Update the grade record with verification information.
        // The department head's address and signature are now permanently
        // associated with this grade record in the blockchain.
        record.departmentHead = msg.sender;
        record.departmentSignature = deptSig;
        record.status = GradeStatus.DepartmentVerified;
        record.updatedAt = block.timestamp;

        // Mark the department signature as used to prevent replay attacks.
        // This ensures the same verification cannot be applied to multiple grades.
        _markSignatureUsed(deptSig);

        // Emit an event to notify external systems of the verification.
        // This allows tracking the progress of grades through the approval workflow.
        emit GradeVerified(gradeId, msg.sender);
    }

    // The general director ratifies a grade that has been verified by a department head.
    // This is the final step in the verification chain. Once ratified, the grade is
    // finalized and becomes immutable, representing the official academic record.
    function ratifyGrade(uint256 gradeId)
        external
        onlyGeneralDirector
        validGradeId(gradeId)
    {
        // Retrieve the grade record from storage. We'll be updating it.
        GradeRecord storage record = gradeRecords[gradeId];

        // Ensure the grade is ready for ratification. The grade must have been
        // verified by a department head but not yet ratified by a general director.
        require(
            record.status == GradeStatus.DepartmentVerified,
            "Grade not verified by department"
        );

        // Create the general director's digital signature for this ratification.
        // This final signature represents the highest level of institutional approval
        // and makes the grade record official and immutable.
        bytes32 directorSig = _generateSignatureHash(gradeId, msg.sender, "ratify");

        // Finalize the grade record with the director's approval.
        // The grade status is updated to Finalized, and the finalized timestamp
        // records when the grade became an official academic record.
        record.generalDirector = msg.sender;
        record.directorSignature = directorSig;
        record.status = GradeStatus.Finalized;
        record.updatedAt = block.timestamp;
        record.finalizedAt = block.timestamp;

        // Mark the director signature as used to prevent replay attacks.
        // This ensures the same ratification cannot be applied to multiple grades.
        _markSignatureUsed(directorSig);

        // Emit events to notify external systems of the ratification and finalization.
        // These events allow applications to know when grades become official records.
        emit GradeRatified(gradeId, msg.sender);
        emit GradeFinalized(gradeId);
    }

    // Allows authorized users to view a complete grade record. The authorization follows
    // a zero-knowledge inspired approach: the student owns their data and controls who
    // can view it, while university officials have institutional access rights.
    function viewGrade(uint256 gradeId)
        external
        view
        validGradeId(gradeId)
        onlyStudentOrWithAccess(gradeId)
        returns (GradeRecord memory)
    {
        // Return the complete grade record from storage.
        // This includes all signatures and timestamps for full transparency.
        return gradeRecords[gradeId];
    }

    // Allows a student to view all their own grade records in one call.
    // This is a convenience function that aggregates all grades belonging to
    // the calling student, making it easy to retrieve complete academic history.
    function viewMyGrades()
        external
        view
        onlyStudent
        returns (GradeRecord[] memory)
    {
        // Get all grade IDs for the calling student.
        uint256[] storage gradeIds = _studentGradeIds[msg.sender];
        
        // Create an array to hold all the grade records.
        // The array size matches the number of grades the student has.
        GradeRecord[] memory grades = new GradeRecord[](gradeIds.length);

        // Populate the array with each grade record.
        // This loop retrieves each grade from storage by its ID.
        for (uint256 i = 0; i < gradeIds.length; i++) {
            grades[i] = gradeRecords[gradeIds[i]];
        }

        return grades;
    }

    // Allows a student to view their grades while hiding sensitive workflow details.
    // This function returns a simplified view of grades that's safe to share with
    // third parties who don't need to see internal verification details.
    function viewMyGradesPublic()
        external
        view
        onlyStudent
        returns (
            uint256[] memory ids,
            string[] memory courseCodes,
            uint256[] memory grades,
            string[] memory semesters,
            GradeStatus[] memory statuses
        )
    {
        // Get all grade IDs for the calling student.
        uint256[] storage gradeIds = _studentGradeIds[msg.sender];
        uint256 count = gradeIds.length;

        // Initialize arrays for the public view.
        // Each array will contain one element per grade record.
        ids = new uint256[](count);
        courseCodes = new string[](count);
        grades = new uint256[](count);
        semesters = new string[](count);
        statuses = new GradeStatus[](count);

        // Populate the arrays with grade information.
        // We exclude sensitive fields like signatures and verifier addresses.
        for (uint256 i = 0; i < count; i++) {
            GradeRecord storage record = gradeRecords[gradeIds[i]];
            ids[i] = record.id;
            courseCodes[i] = record.courseCode;
            grades[i] = record.grade;
            semesters[i] = record.semester;
            statuses[i] = record.status;
        }
    }

     /**
     * @dev Allows authorized users to view all grades for a specific student
     * @param student Address of the student whose grades to view
     * @return Array of GradeRecord for the student
     */
    function viewStudentGrades(address student)
        external
        view
        returns (GradeRecord[] memory)
    {
        require(
            hasAccess(student, msg.sender),
            "No access to student's grades"
        );
        
        uint256[] storage gradeIds = _studentGradeIds[student];
        GradeRecord[] memory grades = new GradeRecord[](gradeIds.length);
        
        for (uint256 i = 0; i < gradeIds.length; i++) {
            grades[i] = gradeRecords[gradeIds[i]];
        }
        
        return grades;
    }

     /**
     * @dev Allows authorized users to view public grade info for a specific student
     * @param student Address of the student whose grades to view
     * @return ids Array of grade IDs
     * @return courseCodes Array of course codes
     * @return grades Array of grade values
     * @return semesters Array of semesters
     * @return statuses Array of statuses
     */
    function viewStudentGradesPublic(address student)
        external
        view
        returns (
            uint256[] memory ids,
            string[] memory courseCodes,
            uint256[] memory grades,
            string[] memory semesters,
            GradeStatus[] memory statuses
        )
    {
        require(
            hasAccess(student, msg.sender),
            "No access to student's grades"
        );
        
        uint256[] storage gradeIds = _studentGradeIds[student];
        uint256 count = gradeIds.length;
        
        ids = new uint256[](count);
        courseCodes = new string[](count);
        grades = new uint256[](count);
        semesters = new string[](count);
        statuses = new GradeStatus[](count);
        
        for (uint256 i = 0; i < count; i++) {
            GradeRecord storage record = gradeRecords[gradeIds[i]];
            ids[i] = record.id;
            courseCodes[i] = record.courseCode;
            grades[i] = record.grade;
            semesters[i] = record.semester;
            statuses[i] = record.status;
        }
    }

    // Allows third parties to verify a student's grade for a specific course.
    // This implements the zero-knowledge inspired privacy: external parties can
    // verify academic standing without accessing unnecessary personal information.
    function verifyStudentGrade(
        address student,
        string memory courseCode
    )
        external
        view
        returns (bool gradeExists, uint256 gradeValue, GradeStatus status)
    {
        // Check if the caller has permission to view this student's grades.
        // The student controls access through the grantAccess/revokeAccess functions.
        require(
            hasAccess(student, msg.sender),
            "No access to student's grades"
        );

        // Get all grade IDs for the student to search for the specific course.
        uint256[] storage gradeIds = _studentGradeIds[student];
        
        // Search through the student's grades for the requested course.
        // We look for the most recent grade in the specified course.
        for (uint256 i = 0; i < gradeIds.length; i++) {
            GradeRecord storage record = gradeRecords[gradeIds[i]];
            
            // Compare course codes to find the matching grade.
            // We use string comparison to match the exact course.
            if (keccak256(bytes(record.courseCode)) == keccak256(bytes(courseCode))) {
                return (true, record.grade, record.status);
            }
        }

        // Return default values if no matching grade was found.
        // The caller can distinguish between "no grade" and "access denied".
        return (false, 0, GradeStatus.Pending);
    }

    // Verifies all three digital signatures on a grade record.
    // This allows anyone to cryptographically verify that a grade has passed through
    // the complete institutional approval chain without needing to trust the institution.
    function verifyGradeSignatures(uint256 gradeId)
        external
        view
        validGradeId(gradeId)
        returns (
            bool teacherValid,
            bool departmentValid,
            bool directorValid,
            bool allValid
        )
    {
        GradeRecord storage record = gradeRecords[gradeId];

        // Initialize all booleans to false
        teacherValid = false;
        departmentValid = false;
        directorValid = false;

        // Recreate each signature hash to verify authenticity.
        // We generate what the signature should be and compare it to what was stored.

        // Check teacher signature
        if (record.teacher != address(0)) {
            bytes32 expectedTeacherSig = _generateSignatureHash(
                gradeId,
                record.teacher,
                "create"
            );
            teacherValid = (record.teacherSignature == expectedTeacherSig);
        }

        // Check department signature if it exists
        if (record.departmentHead != address(0)) {
            bytes32 expectedDeptSig = _generateSignatureHash(
                gradeId,
                record.departmentHead,
                "verify"
            );
            departmentValid = (record.departmentSignature == expectedDeptSig);
        }

        // Check director signature if it exists
        if (record.generalDirector != address(0)) {
            bytes32 expectedDirectorSig = _generateSignatureHash(
                gradeId,
                record.generalDirector,
                "ratify"
            );
            directorValid = (record.directorSignature == expectedDirectorSig);
        }

         // A grade is "all valid" ONLY when:
        // 1. All three signatures exist (all signer addresses are set)
        // 2. All three signatures are cryptographically valid
        allValid = (record.teacher != address(0) && teacherValid) &&
        (record.departmentHead != address(0) && departmentValid) &&
        (record.generalDirector != address(0) && directorValid);
    }

    // Checks if a grade record is fully verified and finalized.
    // This is a convenience function for quick status checks without
    // needing to examine the entire grade record structure.
    function isGradeFinalized(uint256 gradeId)
        external
        view
        validGradeId(gradeId)
        returns (bool)
    {
        return gradeRecords[gradeId].status == GradeStatus.Finalized;
    }

    // Returns the complete verification status of a grade.
    // This provides a human-readable string representation of the grade's
    // position in the approval workflow, useful for user interfaces.
    function getGradeStatus(uint256 gradeId)
        external
        view
        validGradeId(gradeId)
        returns (string memory)
    {
        GradeStatus status = gradeRecords[gradeId].status;
        
        // Convert the enum value to a human-readable string.
        // This makes it easier for external applications to display status.
        if (status == GradeStatus.Pending) {
            return "Pending department verification";
        } else if (status == GradeStatus.DepartmentVerified) {
            return "Verified by department, pending director approval";
        } else if (status == GradeStatus.DirectorApproved) {
            return "Approved by director, pending finalization";
        } else {
            return "Finalized and immutable";
        }
    }

    // Allows university officials to check the progress of grades they need to action.
    // Teachers can see grades they created, department heads see pending grades,
    // and directors see grades awaiting ratification.
    function getGradesByStatus(GradeStatus status)
        external
        view
        returns (uint256[] memory)
    {
        // Count how many grades match the requested status.
        // We need to know the array size before we can create it.
        uint256 count = 0;
        for (uint256 i = 1; i <= _gradeCounter; i++) {
            if (gradeRecords[i].status == status) {
                count++;
            }
        }

        // Create an array to hold the matching grade IDs.
        uint256[] memory matchingGrades = new uint256[](count);
        uint256 index = 0;

        // Populate the array with IDs of grades that match the status.
        // This allows efficient batch processing of grades by status.
        for (uint256 i = 1; i <= _gradeCounter; i++) {
            if (gradeRecords[i].status == status) {
                matchingGrades[index] = i;
                index++;
            }
        }

        return matchingGrades;
    }

    // ============================================
    // SIGNATURE VERIFICATION HELPERS
    // ============================================

    // Generates what a signature should be for a given grade and signer.
    // This is useful for off-chain verification or debugging signature issues.
    // By comparing the generated signature with the stored one, anyone can
    // independently verify the authenticity of a grade record.
    function generateExpectedSignature(
        uint256 gradeId,
        address signer,
        string memory action
    )
        external
        view
        validGradeId(gradeId)
        returns (bytes32)
    {
        return _generateSignatureHash(gradeId, signer, action);
    }

    // Checks if a specific signature hash has already been used in the system.
    // This helps prevent replay attacks by ensuring each signature is unique
    // to a specific grade record and cannot be reused.
    function isSignatureUsed(bytes32 signatureHash)
        external
        view
        returns (bool)
    {
        return _usedSignatures[signatureHash];
    }
}


