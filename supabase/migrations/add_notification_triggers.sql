-- ============================================
-- Notification Triggers
-- ============================================
-- Automatically create notifications when marks are added/updated

-- Function to notify students when marks are added
CREATE OR REPLACE FUNCTION notify_marks_added()
RETURNS TRIGGER AS $$
DECLARE
    v_subject_name text;
BEGIN
    -- Get subject name
    SELECT subjects.name INTO v_subject_name
    FROM subjects
    JOIN class_subjects ON class_subjects.subject_id = subjects.id
    JOIN assessment_components ON assessment_components.class_subject_id = class_subjects.id
    WHERE assessment_components.id = NEW.assessment_component_id;
    
    -- Insert notification for the student
    INSERT INTO notifications (
        recipient_id,
        title,
        message,
        notification_type,
        reference_type,
        reference_id
    )
    VALUES (
        NEW.student_id,
        'New Marks Added',
        'Your marks for ' || COALESCE(v_subject_name, 'a subject') || ' have been added.',
        'marks',
        'student_marks',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for marks insertion
DROP TRIGGER IF EXISTS trigger_notify_marks_added ON student_marks;
CREATE TRIGGER trigger_notify_marks_added
    AFTER INSERT ON student_marks
    FOR EACH ROW
    EXECUTE FUNCTION notify_marks_added();

-- Function to notify students when marks are updated
CREATE OR REPLACE FUNCTION notify_marks_updated()
RETURNS TRIGGER AS $$
DECLARE
    v_subject_name text;
BEGIN
    -- Only notify if marks actually changed
    IF OLD.marks_obtained != NEW.marks_obtained THEN
        -- Get subject name
        SELECT subjects.name INTO v_subject_name
        FROM subjects
        JOIN class_subjects ON class_subjects.subject_id = subjects.id
        JOIN assessment_components ON assessment_components.class_subject_id = class_subjects.id
        WHERE assessment_components.id = NEW.assessment_component_id;
        
        INSERT INTO notifications (
            recipient_id,
            title,
            message,
            notification_type,
            reference_type,
            reference_id
        )
        VALUES (
            NEW.student_id,
            'Marks Updated',
            'Your marks for ' || COALESCE(v_subject_name, 'a subject') || ' have been updated.',
            'marks',
            'student_marks',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for marks update
DROP TRIGGER IF EXISTS trigger_notify_marks_updated ON student_marks;
CREATE TRIGGER trigger_notify_marks_updated
    AFTER UPDATE ON student_marks
    FOR EACH ROW
    EXECUTE FUNCTION notify_marks_updated();

-- Note: Assignment notifications can be added similarly when assignment table is created
-- For now, admins can manually send assignment notifications through the admin portal
