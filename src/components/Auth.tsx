import React from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

const Auth: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Войдите или зарегистрируйтесь, чтобы продолжить
          </p>
        </div>
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          theme="dark"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Электронная почта',
                password_label: 'Пароль',
                email_input_placeholder: 'Ваша электронная почта',
                password_input_placeholder: 'Ваш пароль',
                button_label: 'Войти',
                loading_button_label: 'Вход...',
                social_provider_text: 'Войти через',
                link_text: 'Уже есть аккаунт? Войти',
              },
              sign_up: {
                email_label: 'Электронная почта',
                password_label: 'Пароль',
                email_input_placeholder: 'Ваша электронная почта',
                password_input_placeholder: 'Создайте пароль',
                button_label: 'Зарегистрироваться',
                loading_button_label: 'Регистрация...',
                social_provider_text: 'Зарегистрироваться через',
                link_text: 'Нет аккаунта? Зарегистрироваться',
                confirmation_text: 'Проверьте свою почту для подтверждения регистрации',
              },
              forgotten_password: {
                email_label: 'Электронная почта',
                password_label: 'Пароль',
                email_input_placeholder: 'Ваша электронная почта',
                button_label: 'Отправить инструкцию',
                loading_button_label: 'Отправка...',
                link_text: 'Забыли пароль?',
              },
               magic_link: {
                email_input_label: "Электронная почта",
                email_input_placeholder: "Ваша электронная почта",
                button_label: "Отправить Magic Link",
                loading_button_label: "Отправка...",
                link_text: "Отправить Magic Link",
                confirmation_text: "Проверьте свою почту для получения Magic Link"
              },
              update_password: {
                password_label: "Новый пароль",
                password_input_placeholder: "Ваш новый пароль",
                button_label: "Обновить пароль",
                loading_button_label: "Обновление...",
                confirmation_text: "Ваш пароль был обновлен"
              }
            },
          }}
        />
      </div>
    </div>
  );
};

export default Auth;
